const User = require("../models/User");
const Animal = require("../models/Animal");
const Post = require("../models/Post");
const ServiceProvider = require("../models/ServiceProvider");
const PostVote = require("../models/PostVote");
const Followers = require("../models/Followers");
const Following = require("../models/Following");
const ConfirmationToken = require("../models/ConfirmationToken");
const Notification = require("../models/Notification");
const socketHandler = require("../handlers/socketHandler");
const ObjectId = require("mongoose").Types.ObjectId;
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const crypto = require("crypto");
const logger = require("../logger/logger");
const bcrypt = require("bcrypt");

const {
  validateEmail,
  validateFullName,
  validateUsername,
  validateBio,
  validateWebsite,
} = require("../utils/validation");
const { sendConfirmationEmail } = require("../utils/controllerUtils");

module.exports.retrieveUser = async (req, res, next) => {
  const { username } = req.params;
  const requestingUser = res.locals.user;
  try {
    const user = await User.findOne(
      { username },
      "username fullName avatar bio bookmarks fullName _id website"
    );
    if (!user) {
      return res
        .status(404)
        .send({ error: "Could not find a user with that username." });
    }

    const posts = await Post.aggregate([
      {
        $facet: {
          data: [
            { $match: { author: ObjectId(user._id) } },
            { $sort: { date: -1 } },
            { $limit: 12 },
            {
              $lookup: {
                from: "postvotes",
                localField: "_id",
                foreignField: "post",
                as: "postvotes",
              },
            },
            {
              $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "post",
                as: "comments",
              },
            },
            {
              $lookup: {
                from: "commentreplies",
                localField: "comments._id",
                foreignField: "parentComment",
                as: "commentReplies",
              },
            },
            {
              $unwind: "$postvotes",
            },
            {
              $addFields: { image: "$thumbnail" },
            },
            {
              $project: {
                user: true,
                followers: true,
                following: true,
                comments: {
                  $sum: [{ $size: "$comments" }, { $size: "$commentReplies" }],
                },
                image: true,
                thumbnail: true,
                filter: true,
                caption: true,
                author: true,
                postVotes: { $size: "$postvotes.votes" },
              },
            },
          ],
          postCount: [
            { $match: { author: ObjectId(user._id) } },
            { $count: "postCount" },
          ],
        },
      },
      { $unwind: "$postCount" },
      {
        $project: {
          data: true,
          postCount: "$postCount.postCount",
        },
      },
    ]);

    const followersDocument = await Followers.findOne({
      user: ObjectId(user._id),
    });

    const followingDocument = await Following.findOne({
      user: ObjectId(user._id),
    });

    return res.send({
      user,
      followers: followersDocument.followers.length,
      following: followingDocument.following.length,
      // Check if the requesting user follows the retrieved user
      isFollowing: requestingUser
        ? !!followersDocument.followers.find(
            (follower) => String(follower.user) === String(requestingUser._id)
          )
        : false,
      posts: posts[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports.retrievePosts = async (req, res, next) => {
  // Retrieve a user's posts with the post's comments & likes
  const { username } = req.params;
  const {counter = 0} = req.body;
  try {
    const posts = await Post.aggregate([
      { $sort: { date: -1 } },
      { $skip: Number(counter*12) },
      { $limit: 12 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "user",
        },
      },
      { $match: { "user.username": username } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "postvotes",
          localField: "_id",
          foreignField: "post",
          as: "postVotes",
        },
      },
      { $unwind: "$postVotes" },
      {
        $project: {
          image: true,
          caption: true,
          date: true,
          "user.username": true,
          "user.avatar": true,
          comments: { $size: "$comments" },
          postVotes: { $size: "$postVotes.votes" },
        },
      },
    ]);
    if (posts.length === 0) {
      return res.status(404).send({ error: "Could not find any posts." });
    }
    return res.send(posts);
  } catch (err) {
    next(err);
  }
};

module.exports.bookmarkPost = async (req, res, next) => {
  const { postId } = req.params;
  const user = res.locals.user;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .send({ error: "Could not find a post with that id." });
    }

    const userBookmarkUpdate = await User.updateOne(
      {
        _id: user._id,
        "bookmarks.post": { $ne: postId },
      },
      { $push: { bookmarks: { post: postId } } }
    );
    if (!userBookmarkUpdate.nModified) {
      if (!userBookmarkUpdate.ok) {
        return res.status(500).send({ error: "Could not bookmark the post." });
      }
      // The above query did not modify anything meaning that the user has already bookmarked the post
      // Remove the bookmark instead
      const userRemoveBookmarkUpdate = await User.updateOne(
        { _id: user._id },
        { $pull: { bookmarks: { post: postId } } }
      );
      if (!userRemoveBookmarkUpdate.nModified) {
        return res.status(500).send({ error: "Could not bookmark the post." });
      }
      return res.send({ success: true, operation: "remove" });
    }
    return res.send({ success: true, operation: "add" });
  } catch (err) {
    next(err);
  }
};

module.exports.followUser = async (req, res, next) => {
  const { userId } = req.params;
  const user = res.locals.user;

  try {
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res
        .status(400)
        .send({ error: "Could not find a user with that id." });
    }

    const followerUpdate = await Followers.updateOne(
      { user: userId, "followers.user": { $ne: user._id } },
      { $push: { followers: { user: user._id } } }
    );

    const followingUpdate = await Following.updateOne(
      { user: user._id, "following.user": { $ne: userId } },
      { $push: { following: { user: userId } } }
    );

    if (!followerUpdate.nModified || !followingUpdate.nModified) {
      if (!followerUpdate.ok || !followingUpdate.ok) {
        return res
          .status(500)
          .send({ error: "Could not follow user please try again later." });
      }
      // Nothing was modified in the above query meaning that the user is already following
      // Unfollow instead
      const followerUnfollowUpdate = await Followers.updateOne(
        {
          user: userId,
        },
        { $pull: { followers: { user: user._id } } }
      );

      const followingUnfollowUpdate = await Following.updateOne(
        { user: user._id },
        { $pull: { following: { user: userId } } }
      );
      if (!followerUnfollowUpdate.ok || !followingUnfollowUpdate.ok) {
        return res
          .status(500)
          .send({ error: "Could not follow user please try again later." });
      }
      return res.send({ success: true, operation: "unfollow" });
    }

    const notification = new Notification({
      notificationType: "follow",
      sender: user._id,
      receiver: userId,
      date: Date.now(),
    });

    const sender = await User.findById(user._id, "username avatar");
    const isFollowing = await Following.findOne({
      user: userId,
      "following.user": user._id,
    });

    await notification.save();
    socketHandler.sendNotification(req, {
      notificationType: "follow",
      sender: {
        _id: sender._id,
        username: sender.username,
        avatar: sender.avatar,
      },
      receiver: userId,
      date: notification.date,
      isFollowing: !!isFollowing,
    });

    res.send({ success: true, operation: "follow" });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves either who a specific user follows or who is following the user.
 * Also retrieves whether the requesting user is following the returned users
 * @function retrieveRelatedUsers
 * @param {object} user The user object passed on from other middlewares
 * @param {string} userId Id of the user to be used in the query
 * @param {number} offset The offset for how many documents to skip
 * @param {boolean} followers Whether to query who is following the user or who the user follows default is the latter
 * @returns {array} Array of users
 */
const retrieveRelatedUsers = async (user, userId, offset, followers=false) => {
  // console.log(followers, user, userId, offset);
  const pipeline = [
    {
      $match: { "user.id" : ObjectId(userId) },
    },
    {
      $lookup: {
        from: "users",
        let: followers
          ? { userId: "$followers.user" }
          : { userId: "$following.user" },
        pipeline: [
          {
            $match: {
              // Using the $in operator instead of the $eq
              // operator because we can't coerce the types
              $expr: { $in: ["$_id", "$$userId"] },
            },
          },
          {
            $skip: Number(offset),
          },
          {
            $limit: 10,
          },
        ],
        as: "users",
      },
    },
    {
      $lookup: {
        from: "followers",
        localField: "user.id",
        foreignField: "user.id",
        as: "userFollowers",
      },
    },
    {
      $project: {
        "users._id": true,
        "users.username": true,
        "users.avatar": true,
        "users.fullName": true,
        userFollowers: true,
        "followingDetails" : true
      },
    },
  ];

  const aggregation = followers
    ? await Followers.aggregate(pipeline)
    : await Following.aggregate(pipeline);
  console.log(aggregation);
  // Make a set to store the IDs of the followed users
  const followedUsers = new Set();
  // Loop through every follower and add the id to the set if the user's id is in the array
  aggregation[0].userFollowers.forEach((followingUser) => {
    if (
      !!followingUser.followers.find(
        (follower) => String(follower.user) === String(user._id)
      )
    ) {
      followedUsers.add(String(followingUser.user));
    }
  });
  // Add the isFollowing key to the following object with a value
  // depending on the outcome of the loop above
  aggregation[0].users.forEach((followingUser) => {
    followingUser.isFollowing = followedUsers.has(String(followingUser._id));
  });

  return aggregation[0].users;
};

module.exports.retrieveFollowing = async (req, res, next) => {
  const {userId, counter = 0} = req.body;
  const user = res.locals.user;
  try {
    // const users = await retrieveRelatedUsers(user, userId, counter*10);
    const users = await Following.find({
      "user.id" : ObjectId(userId)
    },
    'followingDetails').populate('followingDetails.followingId', 'username avatar _id fullName').skip(20*counter).limit(20);
    return res.send({"following" : users});
  } catch (err) {
    next(err);
  }
};

module.exports.retrieveFollowers = async (req, res, next) => {
  const {userId, counter = 0} = req.body;
  const user = res.locals.user;
  try {
    // const users = await retrieveRelatedUsers(user, userId, counter*10, true);
    const users = await Followers.find({
      "user.id" : ObjectId(userId)
    },'followerDetails').populate('followerDetails.followerId', 'username avatar _id fullName').skip(20*counter).limit(20);
    return res.send({"followers" : users});
  } catch (err) {
    next(err);
  }
};

searchHuman = async(username,counter,type) => {
  let lim = 10;
  if (type === "Both") {lim = 5;}
  const users = await User.aggregate([
    {
      $match: {
        $or : [{username: { $regex: new RegExp(username,"i")}},{fullName: { $regex: new RegExp(username,"i")}}]
      },
    },
    // {
    //   $lookup: {
    //     from: "followers",
    //     localField: "_id",
    //     foreignField: "user.id",
    //     as: "followers",
    //   },
    // },
    // {
    //   $unwind: "$followers",
    // },
    // {
    //   $addFields: {
    //     followersCount: { $size: "$followers.followers" },
    //   },
    // },
    {
      $sort: { followersCount: -1 },
    },
    {
      $skip: Number(counter*10),
    },
    {
      $limit: lim,
    },
    {
      $project: {
        _id: true,
        username: true,
        avatar: true,
        fullName: true,
      },
    },
  ]);
  users.forEach(function (element) {
    element.type = "User";
  });
  return users;
};

searchAnimal = async(username,counter,type) => {
  let lim = 10;
  if (type === "Both") {lim = 5;}
  const users = await Animal.aggregate([
    {
      $match: {
        $or : [{username: { $regex: new RegExp(username,"i")}},{fullName: { $regex: new RegExp(username,"i")}}]
      },
    },
    {
      $sort: { followersCount: -1 },
    },
    {
      $skip: Number(counter*10),
    },
    {
      $limit: lim,
    },
    {
      $project: {
        _id: true,
        username: true,
        avatar: true,
        fullName: true,
      },
    },
  ]);
  users.forEach(function (element) {
    element.type = "Animal";
  });
  return users;
};



module.exports.searchUsers = async (req, res, next) => {
  const {username, counter = 0, type} = req.body;
  //type will be of 3 types
  // "Both" will mean both User and Animal
  // "Animal" will mean only Animal
  // "User" will mean only User
  if (!username || !type) {
    return res
      .status(400)
      .send({ error: "Please provide a user to search for" });
  }
  try {
    if (type === "User"){
      const users = await searchHuman(username,counter,type);
      if (users.length === 0) {
        return res
          .status(404)
          .send({ error: "Could not find any users matching the criteria." });
      }
      return res.status(200).send({"profiles" : users});
    }
    else if (type == "Animal"){
      const users = await searchAnimal(username,counter,type);
      if (users.length === 0) {
        return res
          .status(404)
          .send({ error: "Could not find any users matching the criteria." });
      }
      return res.status(200).send({"profiles" : users});

    }
    else if (type=== "Both"){
      const humans = await searchHuman(username,counter,type);
      const animals = await searchAnimal(username,counter,type);
      const users = humans.concat(animals);
      if (users.length === 0) {
        return res
          .status(404)
          .send({ error: "Could not find any users matching the criteria." });
      }
      return res.status(200).send({"profiles" : users});
    }
    
  } catch (err) {
    next(err);
  }
};

module.exports.confirmUser = async (req, res, next) => {
  logger.info("***CONFIRM USER CALLED TO VERIFY OTP***");
  const { otp, type } = req.body;
  const user = res.locals.user;

  try {
    if (type && type == "sp") {
      const confirmationToken = await ConfirmationToken.findOne({
        user: user._id,
      });
      if (
        !confirmationToken ||
        Date.now() > confirmationToken.timestamp + 900000
      ) {
        return res
          .status(404)
          .send({ error: "Invalid or expired confirmation link." });
      }
      const token = confirmationToken.token;
      const compareotp = await bcrypt.compare(otp, token);
      if (!compareotp) {
        return res.status(401).send({
          error:
            "The credentials you provided are incorrect, please try again.",
        });
      }
      await ConfirmationToken.deleteOne({ token, user: user._id });
      await ServiceProvider.updateOne({ _id: user._id }, { confirmed: true });
      return res.status(200).send({ message: "verification successful" });
    } else {
      const confirmationToken = await ConfirmationToken.findOne({
        user: user._id,
      });
      if (
        !confirmationToken ||
        Date.now() > confirmationToken.timestamp + 900000
      ) {
        return res
          .status(404)
          .send({ error: "Invalid or expired confirmation link." });
      }
      const token = confirmationToken.token;
      const compareotp = await bcrypt.compare(otp, token);
      if (!compareotp) {
        return res.status(401).send({
          error:
            "The credentials you provided are incorrect, please try again.",
        });
      }
      await ConfirmationToken.deleteOne({ token, user: user._id });
      await User.updateOne({ _id: user._id }, { confirmed: true });
      return res.status(200).send({ message: "verification successful" });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.changeAvatar = async (req, res, next) => {
  const user = res.locals.user;
  const { type } = req.body;

  if (!req.file) {
    return res
      .status(400)
      .send({ error: "Please provide the image to upload." });
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const response = await cloudinary.uploader.upload(req.file.path, {
      width: 200,
      height: 200,
      gravity: "face",
      crop: "thumb",
    });
    fs.unlinkSync(req.file.path);

    if (type && type == "sp") {
      const avatarUpdate = await ServiceProvider.updateOne(
        { _id: user._id },
        { avatar: response.secure_url }
      );

      if (!avatarUpdate.nModified) {
        throw new Error("Could not update user avatar.");
      }

      return res.send({ avatar: response.secure_url });
    } else {
      const avatarUpdate = await User.updateOne(
        { _id: user._id },
        { avatar: response.secure_url }
      );

      if (!avatarUpdate.nModified) {
        throw new Error("Could not update user avatar.");
      }

      return res.send({ avatar: response.secure_url });
    }
  } catch (err) {
    logger.error(`error while changing Avatar::::::: ${JSON.stringify(err)}`);
    next(err);
  }
};

module.exports.removeAvatar = async (req, res, next) => {
  const user = res.locals.user;

  try {
    const avatarUpdate = await User.updateOne(
      { _id: user._id },
      { $unset: { avatar: "" } }
    );
    if (!avatarUpdate.nModified) {
      next(err);
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports.updateProfile = async (req, res, next) => {
  const user = res.locals.user;
  const { fullName, username, website, bio, email } = req.body;
  let confirmationToken = undefined;
  // console.log(req.body.bio+'looo')
  let type=req.body.type;
  let updatedFields = {};
  try {
    if(type && type == "sp"){
      const userDocument = await ServiceProvider.findOne({ _id: user._id });

      if (fullName) {
        const fullNameError = validateFullName(fullName);
        if (fullNameError) return res.status(400).send({ error: fullNameError });
        userDocument.fullName = fullName;
        updatedFields.fullName = fullName;
      }
  
      if (username) {
        const usernameError = validateUsername(username);
        if (usernameError) return res.status(400).send({ error: usernameError });
        // Make sure the username to update to is not the current one
        if (username !== user.username) {
          const existingUser = await ServiceProvider.findOne({ username });
          if (existingUser)
            return res
              .status(400)
              .send({ error: "Please choose another username." });
          userDocument.username = username;
          updatedFields.username = username;
        }
      }
  
      if (website) {
        const websiteError = validateWebsite(website);
        if (websiteError) return res.status(400).send({ error: websiteError });
        if (!website.includes("http://") && !website.includes("https://")) {
          userDocument.website = "https://" + website;
          updatedFields.website = "https://" + website;
        } else {
          userDocument.website = website;
          updatedFields.website = website;
        }
      }
      if(req.body.bio==""){
        userDocument.bio = "";
        updatedFields.bio = "";   
       }
      if (bio) {
        const bioError = validateBio(bio);
        if (bioError) return res.status(400).send({ error: bioError });
        userDocument.bio = bio;
        updatedFields.bio = bio;
      }
  
      if (email) {
        const emailError = validateEmail(email);
        if (emailError) return res.status(400).send({ error: emailError });
        // Make sure the email to update to is not the current one
        if (email !== user.email) {
          const existingUser = await ServiceProvider.findOne({ email});
          if (existingUser)
            return res
              .status(400)
              .send({ error: "Please choose another email." });
          confirmationToken = new ConfirmationToken({
            user: user._id,
            token: crypto.randomBytes(20).toString("hex"),
          });
          await confirmationToken.save();
          userDocument.email = email;
          userDocument.confirmed = false;
          updatedFields = { ...updatedFields, email, confirmed: false };
        }
      }
      const updatedUser = await userDocument.save();
      // console.log(userDocument)
      res.send(updatedFields);
      if (email && email !== user.email) {
        sendConfirmationEmail(
          updatedUser.username,
          updatedUser.email,
          confirmationToken.token
        );
      }
    }
    else {    
    const userDocument = await User.findOne({ _id: user._id });

      if (fullName) {
        const fullNameError = validateFullName(fullName);
        if (fullNameError) return res.status(400).send({ error: fullNameError });
        userDocument.fullName = fullName;
        updatedFields.fullName = fullName;
      }

      if (username) {
        const usernameError = validateUsername(username);
        if (usernameError) return res.status(400).send({ error: usernameError });
        // Make sure the username to update to is not the current one
        if (username !== user.username) {
          const existingUser = await User.findOne({ username });
          if (existingUser)
            return res
              .status(400)
              .send({ error: "Please choose another username." });
          userDocument.username = username;
          updatedFields.username = username;
        }
      }

      if (website) {
        const websiteError = validateWebsite(website);
        if (websiteError) return res.status(400).send({ error: websiteError });
        if (!website.includes("http://") && !website.includes("https://")) {
          userDocument.website = "https://" + website;
          updatedFields.website = "https://" + website;
        } else {
          userDocument.website = website;
          updatedFields.website = website;
        }
      }
      if(req.body.bio==""){
        userDocument.bio = "";
        updatedFields.bio = "";   
      }
      if (bio) {
        const bioError = validateBio(bio);
        if (bioError) return res.status(400).send({ error: bioError });
        userDocument.bio = bio;
        updatedFields.bio = bio;
      }

      if (email) {
        const emailError = validateEmail(email);
        if (emailError) return res.status(400).send({ error: emailError });
        // Make sure the email to update to is not the current one
        if (email !== user.email) {
          const existingUser = await User.findOne({ email});
          if (existingUser)
            return res
              .status(400)
              .send({ error: "Please choose another email." });
          confirmationToken = new ConfirmationToken({
            user: user._id,
            token: crypto.randomBytes(20).toString("hex"),
          });
          await confirmationToken.save();
          userDocument.email = email;
          userDocument.confirmed = false;
          updatedFields = { ...updatedFields, email, confirmed: false };
        }
      }
      const updatedUser = await userDocument.save();
      // console.log(userDocument)
      res.send(updatedFields);
      if (email && email !== user.email) {
        sendConfirmationEmail(
          updatedUser.username,
          updatedUser.email,
          confirmationToken.token
        );
      }
    }
  } 
  catch (err) {
    next(err);
  }
};

module.exports.updateBioAndAvatar = async (req, res, next) => {
  const user = res.locals.user;
  const { bio, avatar } = req.body;
  try {
    const userDocument = await User.findOne({ _id: user._id });
    userDocument.bio = bio;
    userDocument.avatar = avatar;
    const updatedUser = await userDocument.save();
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports.retrieveSuggestedUsers = async (req, res, next) => {
  const { max } = req.params;
  const user = res.locals.user;
  try {
    const users = await User.aggregate([
      {
        $match: { _id: { $ne: ObjectId(user._id) } },
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "user",
          as: "followers",
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$author", "$$userId"],
                },
              },
            },
            {
              $sort: { date: -1 },
            },
            {
              $limit: 3,
            },
          ],
          as: "posts",
        },
      },
      {
        $unwind: "$followers",
      },
      {
        $project: {
          username: true,
          fullName: true,
          email: true,
          avatar: true,
          isFollowing: { $in: [user._id, "$followers.followers.user"] },
          posts: true,
        },
      },
      {
        $match: { isFollowing: false },
      },
      {
        $sample: { size: max ? Number(max) : 20 },
      },
      {
        $sort: { posts: -1 },
      },
      {
        $unset: ["isFollowing"],
      },
    ]);
    res.send(users);
  } catch (err) {
    next(err);
  }
};

module.exports.isUsernameAvaialble = async (req, res, next) => {
  logger.info("****Checking if given username exists or not***");
  const type = req.body.type ? req.body.type : req.query.type;
  const user = res.locals.user;
  const username = req.params.username;
  let existingUser = null;
  try {
    if (type && type == "sp") {
      existingUser = await ServiceProvider.findOne({ username });
      if (!existingUser || user.username === username) {
        res.status(200).send({ isAvailable: true });
      } else {
        res.status(403).send({ isAvailable: false });
      }
    } else {
      existingUser = await User.findOne({ username });
      if (!existingUser || user.username === username) {
        res.status(200).send({ isAvailable: true });
      } else {
        res.status(403).send({ isAvailable: false });
      }
    }
  } catch (err) {
    next(err);
  }
};

module.exports.becomeGuardian = async (req, res, next) => {
  const user = res.locals.user;
  const { idPet } = req.body;
  try {
    const animal = await Animal.findById(idPet);
    if (!animal) return res.status(404).send({ error: "No such pet exists!" });
    const found = user.pets.findIndex(function (ele, index) {
      if (ele.pet == idPet) return true;
    });
    if (found != -1) {
      if (user.pets[found].confirmed) {
        return res
          .status(403)
          .send({ error: `You are already guardian of ${animal.name}` });
      } else {
        return res.status(403).send({
          error: `You have already requested to become guardian of ${animal.name}!`,
        });
      }
    }
    const petObject = {
      pet: idPet,
      confirmed: false,
    };
    const userObject = {
      user: user._id,
      confirmed: false,
    };
    await User.updateOne({ _id: user._id }, { $push: { pets: petObject } });
    await Animal.updateOne(
      { _id: animal._id },
      { $push: { guardians: userObject } }
    );
    return res.status(201).send({
      message: `Request has been sent to ${animal.name} successfully!`,
    });
  } catch (err) {
    logger.info(err);
    res.status(400).send({ error: err });
  }
};

module.exports.getUserDetails = async (req, res, next) => {
  const user = res.locals.user;
  const { idPet } = req.body;
  try {
    const user_details = await User.findById(user._id).populate("pets.pet", '_id name avatar');
    if (!user_details)
      return res.status(404).send({ error: "No such user exists!" });

    const animal_details = await Animal.find({ "guardians.user": user._id }, 'username name avatar');
    // let newAnimalArr = [];
    // if (animal_details.length > 0) {
    //   for (let a1 of animal_details) {
    //     const tempObj = a1.toObject();
    //     // const followersCount = await Followers.aggregate([
    //     //   {
    //     //     $match: { "user.id": ObjectId(a1._id) },
    //     //   },
    //     //   {
    //     //     $count: "totalFollowers",
    //     //   },
    //     // ]);

    //     // let totalFollowers =
    //     //   followersCount.length == 0 ? 0 : followersCount[0].totalFollowers;
    //     // tempObj.totalFollowers = totalFollowers;

    //     // const followingCount = await Following.aggregate([
    //     //   {
    //     //     $match: { "user.id": ObjectId(a1._id) },
    //     //   },
    //     //   {
    //     //     $count: "totalFollowing",
    //     //   },
    //     // ]);

    //     // let totalFollowings =
    //     //   followingCount.length == 0 ? 0 : followingCount[0].totalFollowing;
    //     // tempObj.totalFollowings = totalFollowings;

    //     // const getPosts = await Post.find({
    //     //   "postOwnerDetails.postOwnerId": a1._id,
    //     // });

    //     // let totalLikes = 0;
    //     // let totalPosts = 0;
    //     // if (getPosts.length > 0) {
    //     //   totalPosts = getPosts.length;
    //     //   for (let p1 of getPosts) {
    //     //     const getLikes = await PostVote.aggregate([
    //     //       {
    //     //         $match: { post: ObjectId(p1._id) },
    //     //       },
    //     //       {
    //     //         $count: "totalLikes",
    //     //       },
    //     //     ]);
    //     //     totalLikes +=
    //     //       getLikes.length == 0 ? 0 : Number(getLikes[0].totalLikes);
    //     //   }
    //     // }
    //     // tempObj.totalLikes = totalLikes;
    //     // tempObj.totalPosts = totalPosts;
    //     // const newObj;
    //     // newObj._id = tempObj._id;
    //     // newObj.username = tempObj.username;
    //     // newObj.
    //     newAnimalArr.push(tempObj);
    //   }
    // }

    const followersCount = await Followers.aggregate([
      {
        $match: { "user.id": user._id },
      },
      {
        $count: "totalFollowers",
      },
    ]);

    let totalFollowers =
      followersCount.length == 0 ? 0 : followersCount[0].totalFollowers;

    const followingCount = await Following.aggregate([
      {
        $match: { "user.id": user._id },
      },
      {
        $count: "totalFollowing",
      },
    ]);

    let totalFollowings =
      followingCount.length == 0 ? 0 : followingCount[0].totalFollowing;

    const getPosts = await Post.find({
      "postOwnerDetails.postOwnerId": user._id.toString(),
    });

    let totalLikes = 0;
    let totalPosts = 0;
    if (getPosts.length > 0) {
      totalPosts = getPosts.length;
      for (let p1 of getPosts) {
        const getLikes = await PostVote.aggregate([
          {
            $match: { post: ObjectId(p1._id) },
          },
          {
            $count: "totalLikes",
          },
        ]);
        totalLikes += getLikes.length == 0 ? 0 : Number(getLikes[0].totalLikes);
      }
    }

    return res.status(200).json({
      user_details,
      // newAnimalArr,
      totalFollowers,
      totalFollowings,
      totalLikes,
      totalPosts,
    });
  } catch (err) {
    logger.info(err);
    res.status(400).send({ error: err });
  }
};

module.exports.petanduserdetails = async (req, res, next) => {
  const user = res.locals.user;
  const { idPet } = req.body;
  try {
    const animal = await Animal.findById(idPet);
    if (!animal) return res.status(404).send({ error: "No such pet exists!" });

    const user_details = await User.findById(user);
    if (!user_details)
      return res.status(404).send({ error: "No such user exists!" });

    return res.status(200).json(user_details, animal);
  } catch (err) {
    logger.info(err);
    res.status(400).send({ error: err });
  }
};

module.exports.showPeopleToFollow = async (req, res, next) => {
  const user = res.locals.user;
  const {counter} = req.body;
  try {
    const following = await Following.find({"user.id": user._id},{'followingDetails.followingId': 1, '_id': 0}).lean();
    const followingIds = [];
    for (var i=0; i< following.length; i++){
      followingIds[i] = following[i].followingDetails.followingId.toString();
    }
    const result = await User.find({_id: { $ne: user._id }}, {username: 1, fullName: 1, avatar: 1}).limit(20).skip(20*counter).lean();    
    for (var i=0;i < result.length;i++){
      if (followingIds.indexOf(result[i]._id.toString())>-1){
        result[i]['following'] = 1; // it means user is already following this person
      }
      else{
        result[i]['following'] = 0;
      }
    }
    return res.status(200).send({"profiles":result});
  }
  catch (err){
    console.log(err);
    return res.status(400).send({error: err});
  }
  
}

module.exports.getPendingGuardianRequests = async (req, res, next) => {
  const user = res.locals.user;
  try {
    const userDocument = await User.findById(user._id).populate('pets.pet', '_id name username avatar');
    const pets = userDocument.pets;
    const pendingPets = [];
    for (var i=0;i<pets.length;i++){
      console.log(pets[i]);
      if (!pets[i].confirmed){
        console.log('765')
        pendingPets.push(pets[i].pet);
      }
    }
    console.log(pendingPets);
    return res.status(200).send({"pendingRequests" : pendingPets});
  }
  catch(err){
    console.log(err);
    next(err);
  }
}

module.exports.getUserDetailsById = async (req, res, next) => {
  const { id, type } = req.body;
  let user = {};
  try {
    if (type == "User"){
      user = await User.findById(id).populate("pets.pet", '_id name avatar');
      if (!user)
        return res.status(404).send({ error: "No such user exists!" });
    }
    else {
      user = await Animal.findById(id , 'username name avatar');
      if (!user)
        return res.status(404).send({ error: "No such user exists!" });
    }
    
    const followersCount = await Followers.aggregate([
      {
        $match: { "user.id": id },
      },
      {
        $count: "totalFollowers",
      },
    ]);

    let totalFollowers =
      followersCount.length == 0 ? 0 : followersCount[0].totalFollowers;

    const followingCount = await Following.aggregate([
      {
        $match: { "user.id": id },
      },
      {
        $count: "totalFollowing",
      },
    ]);

    let totalFollowings =
      followingCount.length == 0 ? 0 : followingCount[0].totalFollowing;

    const getPosts = await Post.find({
      "postOwnerDetails.postOwnerId": id,
    });

    let totalLikes = 0;
    let totalPosts = 0;
    if (getPosts.length > 0) {
      totalPosts = getPosts.length;
      for (let p1 of getPosts) {
        const getLikes = await PostVote.aggregate([
          {
            $match: { post: ObjectId(p1._id) },
          },
          {
            $count: "totalLikes",
          },
        ]);
        totalLikes += getLikes.length == 0 ? 0 : Number(getLikes[0].totalLikes);
      }
    }

    return res.status(200).json({
      user,
      totalFollowers,
      totalFollowings,
      totalLikes,
      totalPosts,
    });
  } catch (err) {
    console.log(err);
    logger.info(err);
    res.status(400).send({ error: err });
  }

}
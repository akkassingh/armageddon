const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Animal = require("../models/Animal");
const ServiceProvider = require("../models/ServiceProvider");
const ObjectId = require("mongoose").Types.ObjectId;
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const linkify = require("linkifyjs");
require("linkifyjs/plugins/mention")(linkify);
const fs = require("fs");
const ConfirmationToken = require("../models/ConfirmationToken");
const bcrypt = require("bcrypt");
const admin = require("../admin");
const FcmToken = require('../models/FcmToken');
const socketHandler = require("../handlers/socketHandler");

/**
 * Function to send notification with given parameters
 * @function notify
 * @param {Object}  notif The object comprising of body, image and token (title is not required)
 * @param {string} channel The channel in which we want to send notification
 * @return {string} Response -- with successCount and failureCount
 */

module.exports.notify = async(notif, channel) => {
  const options = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };
  const message = {
    data: {
       title: 'Tamely',
       body : notif.body,
       android_channel_id: channel,
       image: notif.image,
      },
  };
  try{
    await admin.messaging().sendToDevice(notif.token, message, options);
    return true;
    //  "failureCount": 0,
    //  "successCount": 1,
  }
  catch (err){
    console.log(err)
    next(err);
  }
}

/**
 * Function to send notification to a user with given userId
 * @function notifyUser
 * @param {Object}  notif The object comprising of title,body and image
 * @param {string} channel The channel in which we want to send notification
 * @param {string} userId The id of user to whom we want to send notification
 * @return {string} Response -- none
 */

module.exports.notifyUser = async(notif, channel, userId) => {
  try{
    const fcmtoken = await FcmToken.findOne({user : ObjectId(userId)});
    if (fcmtoken){
      notif = {...notif, token: fcmtoken.token};
      this.notify(notif,channel);
    }
  }
  catch (err) {
    console.log(err)
  }
}
/**
 * Function to send notification to a guardians of given animal
 * @function notifyAnimal
 * @param {Object}  notif The object comprising of title,body and image and token
 * @param {string} channel The channel in which we want to send notification
 * @param {string} animalId The id of animal to whose guardians we want to send notification
 * @return {string} Response -- none
 */
module.exports.notifyAnimal = async (notif, channel, animalId) => {
  try{
    const animalDoc = await Animal.findOne({_id : ObjectId(animalId)}, 'guardians username');
    let guardians = null
    if (animalDoc) guardians = animalDoc.guardians;
    if (guardians && guardians.length){
      for (var i=0;i<guardians.length; i++){
        let fcmtoken = await FcmToken.findOne({user : ObjectId(guardians[i].user)});
        if (fcmtoken){
          let obj = {...notif, token : fcmtoken.token};
          this.notify(obj,'tamelyid');
        }
      }
    }
  }
  catch (err) {
    console.log(err);
  }
}

module.exports.hashPassword = async (password, saltRounds) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (err) {
    return null;
  }
};
/**
 * Retrieves a post's comments with a specified offset
 * @function retrieveComments
 * @param {string} postId The id of the post to retrieve comments from
 * @param {number} offset The amount of comments to skip
 * @returns {array} Array of comments
 */
module.exports.retrieveComments = async (postId, offset, exclude = 0) => {
  try {
    const unwantedUserFields = [
      "Userauthor.password",
      "Userauthor.private",
      "Userauthor.confirmed",
      "Userauthor.bookmarks",
      "Userauthor.email",
      "Userauthor.website",
      "Userauthor.bio",
      "Userauthor.githubId",
      "Userauthor.pets",
      "Userauthor.googleUserId"
    ];
    const unwantedAnimalFields = [
      "Animalauthor.mating",
      "Animalauthor.adoption",
      "Animalauthor.playBuddies",
      "Animalauthor.username",
      "Animalauthor.category",
      "Animalauthor.animal_type",
      "Animalauthor.location",
      "Animalauthor.guardians",
      "Animalauthor.pets",
      "Animalauthor.bio",
      "Animalauthor.animalType",
      "Animalauthor.gender",
      "Animalauthor.breed",
      "Animalauthor.age",
      "Animalauthor.playFrom",
      "Animalauthor.playTo",
      "Animalauthor.servicePet",
      "Animalauthor.spayed",
      "Animalauthor.friendlinessWithHumans",
      "Animalauthor.friendlinessWithAnimals",
      "Animalauthor.favouriteThings",
      "Animalauthor.thingsDislikes",
      "Animalauthor.uniqueHabits",
      "Animalauthor.eatingHabits",
      "Animalauthor.relatedAnimals",
      "Animalauthor.registeredWithKennelClub"
    ];
    const commentsAggregation = await Comment.aggregate([
      {
        $facet: {
          comments: [
            { $match: { post: ObjectId(postId) } },
            // Sort the newest comments to the top
            { $sort: { date: -1 } },
            // Skip the comments we do not want
            // This is desireable in the even that a comment has been created
            // and stored locally, we'd not want duplicate comments
            { $skip: Number(exclude*10) },
            // Re-sort the comments to an ascending order
            // { $sort: { date: 1 } },
            { $skip: Number(offset) },
            { $limit: 10 },
            {
              $lookup: {
                from: "commentreplies",
                localField: "_id",
                foreignField: "parentComment",
                as: "commentReplies",
              },
            },
            {
              $lookup: {
                from: "commentvotes",
                localField: "_id",
                foreignField: "comment",
                as: "commentVotes",
              },
            },
            // { $unwind: "$commentVotes" },
            {
              $lookup: {
                from: "users",
                localField: "Userauthor",
                foreignField: "_id",
                as: "Userauthor",
              },
            },
            {
              $unset: unwantedUserFields,
            },     
            {
              $lookup: {
                from: "animals",
                localField: "Animalauthor",
                foreignField: "_id",
                as: "Animalauthor",
              },
            },
            {
              $unset: unwantedAnimalFields,
            },     
            {
              $addFields: {
                commentReplies: { $size: "$commentReplies" },
                commentVotes: "$commentVotes.votes",
              },
            },
            // {
            //   $unset: [
            //     "author.password",
            //     "author.email",
            //     "author.private",
            //     "author.bio",
            //     "author.bookmarks",
            //   ],
            // },
          ],
          commentCount: [
            {
              $match: { post: ObjectId(postId) },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
        },
      },
      {
        $unwind: "$commentCount",
      },
      {
        $addFields: {
          commentCount: "$commentCount.count",
        },
      },
    ]);
    return commentsAggregation[0];
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * @function sendEmail
 * @param {string} to The destination email address to send an email to
 * @param {string} subject The subject of the email
 * @param {html} template Html to include in the email
 */

module.exports.sendEmail = async (to, subject, template) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  try {
    await transporter.sendMail({
      from: '"Tamely Support" <support@tamely.in>',
      to,
      subject,
      html: template,
    });
  } catch (err) {
    console.log(err);
  }
};

/**
 * Sends a confirmation email to an email address
 * @function sendConfirmationEmail
 * @param {string} username The username of the user to send the email to
 * @param {string} email The email of the user to send the email to
 * @param {string} confirmationToken The token to use to confirm the email
 */
module.exports.sendConfirmationEmail = async (
  username,
  email,
  confirmationToken
) => {
  //  if (process.env.NODE_ENV === 'production') {
  try {
    const source = fs.readFileSync("templates/confirmationEmail.html", "utf8");
    template = handlebars.compile(source);
    const html = template({
      username: username,
      confirmationUrl: `${process.env.HOME_URL}/confirm/${confirmationToken}`,
      url: process.env.HOME_URL,
    });
    await this.sendEmail(email, "Confirm your Tamely account", html);
  } catch (err) {
    console.log(err);
  }
  // }
};

module.exports.sendOTPEmail = async (username, email, otp) => {
  try {
    const source = fs.readFileSync("templates/verifyEmailOtp.html", "utf8");
    template = handlebars.compile(source);
    const html = template({
      username: username,
      url: process.env.HOME_URL,
      otp: otp,
    });
    await this.sendEmail(email, "Confirm your Tamely account", html);
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports.sendPasswordResetOTP = async (
  email,
  current_time,
  otp,
  type
) => {
  let user = null;
  // if (process.env.NODE_ENV === 'production') {
  try {
    if (type && type === "sp") {
      user = await ServiceProvider.findOne({ email });
      if (!user) throw Error("No user with given email id exists");
      const source = fs.readFileSync(
        "templates/passwordResetEmail.html",
        "utf8"
      );
      template = handlebars.compile(source);
      const html = template({
        username: user.username,
        otp: otp,
      });
      const hashedotp = await this.hashPassword(otp.toString(), 10);
      const confirmationTokenDocument = await ConfirmationToken.findOne({
        user: user._id,
      });
      if (!confirmationTokenDocument) {
        const confirmationToken = new ConfirmationToken({
          user: user._id,
          resettoken: hashedotp,
          timestampreset: current_time,
        });
        await confirmationToken.save();
      } else {
        await ConfirmationToken.findOneAndUpdate(
          { user: user._id },
          {
            resettoken: hashedotp,
            timestampreset: current_time,
          }
        );
      }
      await this.sendEmail(
        user.email,
        "Reset Your Tamely Account Password",
        html
      );
    } else {
      user = await User.findOne({ email });
      if (!user) throw Error("No user with given email id exists");
      const source = fs.readFileSync(
        "templates/passwordResetEmail.html",
        "utf8"
      );
      template = handlebars.compile(source);
      const html = template({
        username: user.username,
        otp: otp,
      });
      const hashedotp = await this.hashPassword(otp.toString(), 10);
      const confirmationTokenDocument = await ConfirmationToken.findOne({
        user: user._id,
      });
      if (!confirmationTokenDocument) {
        const confirmationToken = new ConfirmationToken({
          user: user._id,
          resettoken: hashedotp,
          timestampreset: current_time,
        });
        await confirmationToken.save();
      } else {
        await ConfirmationToken.findOneAndUpdate(
          { user: user._id },
          {
            resettoken: hashedotp,
            timestampreset: current_time,
          }
        );
      }
      // await User.findOneAndUpdate({ email: email},{passwordResetTime: current_time});
      await this.sendEmail(
        user.email,
        "Reset Your Tamely Account Password",
        html
      );
    }
  } catch (err) {
    console.log(err);
  }
  // }
};

/**
 * Formats a cloudinary thumbnail url with a specified size
 * @function formatCloudinaryUrl
 * @param {string} url The url to format
 * @param {size} number Desired size of the image ; pass notify : true incase of notifications
 * @return {string} Formatted url
 */
module.exports.formatCloudinaryUrl = (url, size, thumb) => {
  const splitUrl = url.split("upload/");
  if (size.notify){
    splitUrl[0] += 'upload/'
    splitUrl[0] += 'r_max';
    var n = splitUrl[1].length;
    if (splitUrl[1].substring(n-3,n) != "png"){
      splitUrl[1] = splitUrl[1].substring(0,n-3) + "png"
    } 
  }
  else{
    splitUrl[0] += `upload/${
      size.y && size.z ? `x_${size.x},y_${size.y},` : ""
    }w_${size.width},h_${size.height}${thumb && ",c_thumb"}`;
  }
  splitUrl[0] += '/'
  const formattedUrl = splitUrl[0] + splitUrl[1];
  return formattedUrl;
};

/**
 * Sends a notification when a user has commented on your post
 * @function sendCommentNotification
 * @param {object} req The request object
 * @param {object} sender User who triggered the notification
 * @param {string} receiver Id of the user to receive the notification
 * @param {string} image Image of the post that was commented on
 * @param {string} filter The filter applied to the image
 * @param {string} message The message sent by the user
 * @param {string} postId The id of the post that was commented on
 */
module.exports.sendCommentNotification = async (
  req,
  sender,
  Userreceiver,
  Animalreceiver,
  image,
  filter,
  message,
  postId
) => {
  try {
    if (String(sender._id) !== String(Userreceiver) && String(sender._id) !== String(Animalreceiver)) {
      const notification = new Notification({
        sender: sender._id,
        Userreceiver,
        Animalreceiver,
        notificationType: "comment",
        date: Date.now(),
        notificationData: {
          postId,
          image,
          message,
          filter,
        },
      });
      let ep=await notification.save();
      console.log(ep)
      socketHandler.sendNotification(req, {
        ...notification.toObject(),
        sender: {
          _id: sender._id,
          username: sender.username,
          avatar: sender.avatar,
        },
      });
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Sends a notification when a user has commented on your post
 * @function sendCommentNotification
 * @param {object} req The request object
 * @param {object} sender User who triggered the notification
 * @param {string} receiver Id of the user to receive the notification
 * @param {string} image Image of the post that was commented on
 * @param {string} filter The filter applied to the image
 * @param {string} message The message sent by the user
 * @param {string} postId The id of the post that was commented on
 */
 module.exports.sendPostVotenotification = async (
  req,
  sender,
  Userreceiver,
  Animalreceiver,
  image,
  filter,
  postId
) => {
  try {
    if (String(sender._id) !== String(Userreceiver) && String(sender._id) !== String(Animalreceiver)) {
      const notification = new Notification({
        sender: sender._id,
        Userreceiver,
        Animalreceiver,
        notificationType: "like",
        date: Date.now(),
        notificationData: {
          postId,
          image,
          filter,
        },
      });
      let ep=await notification.save();
      console.log(ep)
      socketHandler.sendNotification(req, {
        ...notification.toObject(),
        sender: {
          _id: sender._id,
          username: sender.username,
          avatar: sender.avatar,
        },
      });
    }
  } catch (err) {
    throw new Error(err.message);
  }
};


/**
 * Sends a notification to the user when the user is mentioned
 * @function sendMentionNotification
 * @param {object} req The request object
 * @param {string} message The message sent by the user
 * @param {string} image Image of the post that was commented on
 * @param {object} post The post that was commented on
 * @param {object} user User who commented on the post
 */
module.exports.sendMentionNotification = (req, message, image, post, user) => {
  const mentionedUsers = new Set();
  // Looping through every mention and sending a notification when necessary
  linkify.find(message).forEach(async (item) => {
    // Making sure a mention notification is not sent to the sender or the poster
    if (
      item.type === "mention" &&
      item.value !== `@${user.username}` &&
      item.value !== `@${post.author.username}` &&
      // Making sure a mentioned user only gets one notification regardless
      // of how many times they are mentioned in one comment
      !mentionedUsers.has(item.value)
    ) {
      mentionedUsers.add(item.value);
      // Finding the receiving user's id
      const receiverDocument = await User.findOne({
        username: item.value.split("@")[1],
      });
      if (receiverDocument) {
        const notification = new Notification({
          sender: user._id,
          receiver: receiverDocument._id,
          notificationType: "mention",
          date: Date.now(),
          notificationData: {
            postId: post._id,
            image,
            message,
            filter: post.filter,
          },
        });
        await notification.save();
        socketHandler.sendNotification(req, {
          ...notification.toObject(),
          sender: {
            _id: user._id,
            username: user.username,
            author: user.author,
          },
        });
      }
    }
  });
};

/**
 * Generates a unique username based on the base username
 * @function generateUniqueUsername
 * @param {string} baseUsername The first part of the username to add a random number to
 * @returns {string} Unique username
 */
module.exports.generateUniqueUsername = async (baseUsername) => {
  let uniqueUsername = undefined;
  try {
    while (!uniqueUsername) {
      const username = baseUsername + Math.floor(Math.random(1000) * 9999 + 1);
      const user = await User.findOne({ username });
      if (!user) {
        uniqueUsername = username;
      }
    }
    return uniqueUsername;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports.populatePostsPipeline = [
  {
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
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
    $lookup: {
      from: "postvotes",
      localField: "_id",
      foreignField: "post",
      as: "postVotes",
    },
  },
  {
    $unwind: "$postVotes",
  },
  {
    $unwind: "$author",
  },
  {
    $addFields: {
      comments: { $size: "$comments" },
      commentReplies: { $size: "$commentReplies" },
      postVotes: { $size: "$postVotes.votes" },
    },
  },
  {
    $addFields: { comments: { $add: ["$comments", "$commentReplies"] } },
  },
  {
    $unset: [
      "commentReplies",
      "author.private",
      "author.confirmed",
      "author.githubId",
      "author.bookmarks",
      "author.password",
    ],
  },
];

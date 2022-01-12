const cloudinary = require("cloudinary").v2;
const linkify = require("linkifyjs");
const axios = require("axios");
require("linkifyjs/plugins/hashtag")(linkify);
const Animal = require("../models/Animal");
const Comment = require("../models/Comment");
const User = require("../models/User");
const CommentReply = require("../models/CommentReply");
const CommentVote = require("../models/CommentVote");
const CommentReplyVote = require("../models/CommentReplyVote");
const FollowRequest = require("../models/FollowRequest");
const Post = require("../models/Post");
const PostVote = require("../models/PostVote");
const Following = require("../models/Following");
const Followers = require("../models/Followers");
const Notification = require("../models/Notification");
const socketHandler = require("../handlers/socketHandler");
const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;
const jwt = require("jwt-simple");
const {notify, notifyUser, notifyAnimal} = require('../utils/controllerUtils');
const FcmToken = require("../models/FcmToken");

const {
  retrieveComments,
  formatCloudinaryUrl,
  populatePostsPipeline,
  sendPostVotenotification
} = require("../utils/controllerUtils");
const filters = require("../utils/filters");
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
  "Userauthor.googleUserId",
  "Userauthor.__v"
];
const unwantedAnimalFields = [
  "Animalauthor.mating",
  "Animalauthor.adoption",
  "Animalauthor.playBuddies",
  // "Animalauthor.username",
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
  "Animalauthor.registeredWithKennelClub",
  "Animalauthor.bookmarks",
  "Animalauthor.__v"
];

module.exports.createPost = async (req, res, next) => {
  let user=undefined;
  // console.log('loooooooooS')
  if(req.headers.type=="User")
   user = res.locals.user
  else
   user = res.locals.animal
  const { caption, filter: filterName, Animalauthor, Userauthor, authorType, group, image, thumbnail, isGroupPost } = req.body;
  if (authorType == "Animal" && !Animalauthor){
    res.status(400).send("Invalid Request");
  }
  if (authorType == "User" && !Userauthor){
    res.status(400).send("invalid Request!")
  }
  let post = undefined;
  const filterObject = filters.find((filter) => filter.name === filterName);
  const hashtags = [];
  linkify.find(caption).forEach((result) => {
    if (result.type === "hashtag") {
      hashtags.push(result.value.substring(1));
    }
  });

  // if (!req.file) {
  //   return res
  //     .status(400)
  //     .send({ error: "Please provide the image to upload." });
  // }

  // cloudinary.config({
  //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  //   api_key: process.env.CLOUDINARY_API_KEY,
  //   api_secret: process.env.CLOUDINARY_API_SECRET,
  // });

  try {
    // const response = await cloudinary.uploader.upload(req.file.path);
    // const moderationResponse = await axios.get(
    //   `https://api.moderatecontent.com/moderate/?key=${process.env.MODERATECONTENT_API_KEY}&url=${response.secure_url}`
    // );

    // if (moderationResponse.data.error) {
    //   return res
    //     .status(500)
    //     .send({ error: "Error moderating image, please try again later." });
    // }

    // if (moderationResponse.data.rating_index > 2) {
    //   return res.status(403).send({
    //     error: "The content was deemed too explicit to upload.",
    //   });
    // }

    // const thumbnailUrl = formatCloudinaryUrl(
    //   response.secure_url,
    //   {
    //     width: 400,
    //     height: 400,
    //   },
    //   true
    // );
    // fs.unlinkSync(req.file.path);
    if (req.headers.type=="User"){
      if (group){
        console.log("VALUE OF GRP ID IS", group);
        post = new Post({
          // image: response.secure_url,
          image,
          // thumbnail: thumbnailUrl,
          thumbnail,
          filter: filterObject ? filterObject.filter : "",
          caption,
          hashtags,
          Userauthor,
          authorType,
          group
        });
      }
      else{
        post = new Post({
          // image: response.secure_url,
          image,
          // thumbnail: thumbnailUrl,
          thumbnail,
          filter: filterObject ? filterObject.filter : "",
          caption,
          hashtags,
          Userauthor,
          authorType,
        });
      }
    }
    if (req.headers.type=="Animal"){
      if (group){
        post = new Post({
          // image: response.secure_url,
          // thumbnail: thumbnailUrl,
          image,
          thumbnail,
          filter: filterObject ? filterObject.filter : "",
          caption,
          hashtags,
          Animalauthor,
          authorType,
          group
        });
      }
      else{
        post = new Post({
          // image: response.secure_url,
          // thumbnail: thumbnailUrl,
          image,
          thumbnail,
          filter: filterObject ? filterObject.filter : "",
          caption,
          hashtags,
          Animalauthor,
          authorType,
        });
      }
      
    }
    // const postVote = new PostVote({
    //   post: post._id,
    // });
    await post.save();
    // await postVote.save();
    res.status(201).json({
      post,
      postVotes: [],
      comments: [],
      author: { avatar: user.avatar, username: user.username },
    });
  } catch (err) {
    next(err);
  }

  // try {
  //   // Updating followers feed with post
  //   const followersDocument = await Followers.find({ 'user.id': user._id });
  //   const followers = followersDocument[0].followers;
  //   const postObject = {
  //     ...post.toObject(),
  //     author: { username: user.username, avatar: user.avatar },
  //     commentData: { commentCount: 0, comments: [] },
  //     postVotes: [],
  //   };

  //   // socketHandler.sendPost(req, postObject, user._id);
  //   followers.forEach((follower) => {
  //     socketHandler.sendPost(
  //       req,
  //       // Since the post is new there is no need to look up any fields
  //       postObject,
  //       follower.user
  //     );
  //   });
  // } catch (err) {
  //   console.log(err);
  // }
};

// module.exports.deletePost = async (req, res, next) => {
//   const { postId } = req.body;
//   const user = res.locals.user;

//   try {
//     const post = await Post.findOne({ _id: postId, author: user._id });
//     if (!post) {
//       return res.status(404).send({
//         error: "Could not find a post with that id associated with the user.",
//       });
//     }
//     // This uses pre hooks to delete everything associated with this post i.e comments
//     const postDelete = await Post.deleteOne({
//       _id: postId,
//     });
//     if (!postDelete.deletedCount) {
//       return res.status(500).send({ error: "Could not delete the post." });
//     }
//     res.status(204).send();
//   } catch (err) {
//     next(err);
//   }
// };

module.exports.retrievePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    // Retrieve the post and the post's votes
    const post = await Post.aggregate([
      { $match: { _id: ObjectId(postId) } },
      {
        $lookup: {
          from: "postvotes",
          localField: "_id",
          foreignField: "post",
          as: "postVotes",
        },
      },
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
      { $unwind: "$postVotes" },
      // {
      //   $unset: [
      //     "author.password",
      //     "author.email",
      //     "author.private",
      //     "author.bio",
      //     "author.githubId",
      //   ],
      // },
      {
        $addFields: { postVotes: "$postVotes.votes" },
      },
    ]);
    if (post.length === 0) {
      return res
        .status(404)
        .send({ error: "Could not find a post with that id." });
    }
    // Retrieve the comments associated with the post aswell as the comment's replies and votes
    const comments = await retrieveComments(postId, 0);

    return res.send({ ...post[0], commentData: comments });
  } catch (err) {
    next(err);
  }
};

module.exports.votePost = async (req, res, next) => {
  // console.log("------------", req.body);
  const { postId, voterDetails, vote } = req.body;
  let user=undefined;
  if(req.headers.type=="User")
   user = res.locals.user
  else
   user = res.locals.animal
  let post = await Post.findById(postId);
   if (!post) {
     return res
       .status(404)
       .send({ error: 'Could not find a post with that post id.' });
   }
  try {
    if (vote === true) {
      let check;
      if (voterDetails.voterType === "animal") {
        check = await PostVote.find({
          $and: [
            { "voterDetails.Animalvoter": ObjectId(user._id) },
            { post: ObjectId(postId) },
          ],
        });
        if (check.length > 0) {
          return res.send({ success: true });
        } else {
          let postVote = new PostVote({
            post: ObjectId(postId),
            voterDetails: {
              voterType: "animal",
              Animalvoter: ObjectId(user._id),
            },
          });
          await postVote.save();
          res.send({ success: true });

          // Sending a like notification
          // const post = await Post.findById(postId);
          // if (String(post.author) !== String(user._id)) {
          //   // Create thumbnail link
          //   const image = formatCloudinaryUrl(
          //     post.image,
          //     {
          //       height: 50,
          //       width: 50,
          //     },
          //     true
          //   );
          //   const notification = new Notification({
          //     sender: user._id,
          //     receiver: post.author,
          //     notificationType: "like",
          //     date: Date.now(),
          //     notificationData: {
          //       postId,
          //       image,
          //       filter: post.filter,
          //     },
          //   });

          //   await notification.save();
          //   socketHandler.sendNotification(req, {
          //     ...notification.toObject(),
          //     sender: {
          //       _id: user._id,
          //       username: user.username,
          //       avatar: user.avatar,
          //     },
          //   });
          //   return res.send({ success: true });
          // } else {
          //   return res.send({ success: true });
          // }
        }
      } else {
        check = await PostVote.findOne({ "voterDetails.Uservoter": user._id, post: postId});
        if (check) {
          // console.log('loooooo'+check+'loooooo')
          return res.send({ success: true });
        } else {
          let postVote = new PostVote({
            post: ObjectId(postId),
            voterDetails: {
              voterType: "human",
              Uservoter: user._id,
            },
          });
          await postVote.save();
          res.send({ success: true });
        }
      }
      try {
        // Sending comment notification
        let image = formatCloudinaryUrl(
          post.image,
          { height: 50, width: 50, x: '100%', y: '100%' },
          true
        );
        sendPostVotenotification(
          req,
          user,
          post.Userauthor,
          post.Animalauthor,
          image,
          post.filter,
          post._id
        );
        if (post.authorType == "User"){
            let body = `${user.username} liked your post recently.`
            let channel = 'tamelyid';
            let image = formatCloudinaryUrl(
              post.image,
              { height: 256, width: 512, x: '100%', y: '100%' },
              true
            );
            const n_obj = {body, image}
            notifyUser(n_obj,channel,post.Userauthor);
          
        }
        else{
          let n_obj = {
            body : `${user.username} liked ${animalDoc.username}'s post recently.`,
            image : formatCloudinaryUrl(
              post.image,
              { height: 256, width: 512, x: '100%', y: '100%' },
              true
            ),
          }
          notifyAnimal(n_obj,'tamelyid',post.Animalauthor);
        }
        // Find the username of the post author
        // const postDocument = await Post.findById(post._id).populate('author');
        // image = formatCloudinaryUrl(
        //   post.image,
        //   { height: 50, width: 50, x: '100%', y: '100%' },
        //   true
        // );
    
        // // Sending a mention notification
        // sendMentionNotification(req, message, image, postDocument, user);
      } catch (err) {
        console.log(err);
      }
    } else {
      let check;
      if (voterDetails.voterType === "animal") {
        check = await PostVote.find({
          $and: [
            { "voterDetails.Animalvoter": ObjectId(user._id) },
            { post: ObjectId(postId) },
          ],
        });
        if (check.length > 0) {
          let deletePostVote = await PostVote.findByIdAndDelete({
            _id: check[0]._id,
          });
          return res.send({ success: true });
        } else {
          return res.send({ success: true });
        }
      } else {
        check = await PostVote.find({
          $and: [
            { "voterDetails.Uservoter": user._id },
            { post: ObjectId(postId) },
          ],
        });
        if (check.length > 0) {
          let deletePostVote = await PostVote.findByIdAndDelete({
            _id: check[0]._id,
          });
          return res.send({ success: true });
        } else {
          return res.send({ success: true });
        }
      }
    }
  } catch (err) {
    next(err);
  }
};

module.exports.postComment = async (req, res, next) => {
  const { message, postId, authorDetails } = req.body;
  const user = res.locals.user;

  try {
    let postComment = new Comment({
      post: ObjectId(postId),
      message: message,
      authorDetails: {
        authorType: authorDetails.authorType,
        authorId: ObjectId(authorDetails.authorId),
      },
    });
    await postComment.save();
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports.editComment = async (req, res, next) => {
  const { message, commentId } = req.body;
  const user = res.locals.user;

  try {
    let editComment = await Comment.findByIdAndUpdate(
      { _id: ObjectId(commentId) },
      { message: message }
    );
    return res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports.deleteComment = async (req, res, next) => {
  console.log("----------inside deleteComment---------");
  const { commentId } = req.body;
  const user = res.locals.user;

  try {
    let deleteComment = await Comment.findByIdAndDelete({
      _id: ObjectId(commentId),
    });
    return res.send({ success: true });
  } catch (err) {
    console.log("---------", err);
    next(err);
  }
};

module.exports.postSubComment = async (req, res, next) => {
  const { message, parentCommentId, authorDetails } = req.body;
  const user = res.locals.user;

  try {
    let postCommentReply = new CommentReply({
      parentComment: ObjectId(parentCommentId),
      message: message,
      authorDetails: {
        authorType: authorDetails.authorType,
        authorId: ObjectId(authorDetails.authorId),
      },
    });
    await postCommentReply.save();
    return res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports.editSubComment = async (req, res, next) => {
  const { message, subCommentId } = req.body;
  const user = res.locals.user;

  try {
    let editSubComment = await CommentReply.findByIdAndUpdate(
      { _id: ObjectId(subCommentId) },
      { message: message }
    );
    return res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports.deleteSubComment = async (req, res, next) => {
  console.log("----------inside deleteComment---------");
  const { subCommentId } = req.body;
  const user = res.locals.user;

  try {
    let deleteSubComment = await CommentReply.findByIdAndDelete({
      _id: ObjectId(subCommentId),
    });
    return res.send({ success: true });
  } catch (err) {
    console.log("---------", err);
    next(err);
  }
};

module.exports.postCommentVote = async (req, res, next) => {
  const { commentId, voterDetails, flag } = req.body;
  const user = res.locals.user;

  try {
    if (flag === true) {
      let voterId =
        voterDetails.voterId === null ? user._id : voterDetails.voterId;
      let getCommentVote = await CommentVote.find({
        $and: [{ commentId: commentId }, { "voterDetails.voterId": voterId }],
      });
      if (getCommentVote.length > 0) {
        return res.send({ success: true });
      } else {
        let storeCommentVote = new CommentVote({
          commentId: ObjectId(commentId),
          voterDetails: {
            voterType: voterDetails.voterType,
            voterId: voterDetails.voterId === null ? user._id : voterId,
          },
        });
        await storeCommentVote.save();
        return res.send({ success: true });
      }
    } else {
      let voterId =
        voterDetails.voterId === null ? user._id : voterDetails.voterId;
      let getCommentVote = await CommentVote.find({
        $and: [{ commentId: commentId }, { "voterDetails.voterId": voterId }],
      });
      if (getCommentVote.length > 0) {
        await CommentVote.findByIdAndDelete({ _id: getCommentVote[0]._id });
      }
      return res.send({ success: true });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.postSubCommentVote = async (req, res, next) => {
  const { subCommentId, voterDetails, flag } = req.body;
  const user = res.locals.user;

  try {
    if (flag === true) {
      let voterId =
        voterDetails.voterId === null ? user._id : voterDetails.voterId;
      let getCommentVote = await CommentReplyVote.find({
        $and: [
          { comment: ObjectId(subCommentId) },
          { "voterDetails.voterId": voterId },
        ],
      });
      if (getCommentVote.length > 0) {
        return res.send({ success: true });
      } else {
        let storeCommentVote = new CommentReplyVote({
          comment: ObjectId(subCommentId),
          voterDetails: {
            voterType: voterDetails.voterType,
            voterId: voterDetails.voterId === null ? user._id : voterId,
          },
        });
        await storeCommentVote.save();
        return res.send({ success: true });
      }
    } else {
      let voterId =
        voterDetails.voterId === null ? user._id : voterDetails.voterId;
      let getCommentVote = await CommentReplyVote.find({
        $and: [
          { comment: ObjectId(subCommentId) },
          { "voterDetails.voterId": voterId },
        ],
      });
      if (getCommentVote.length > 0) {
        await CommentReplyVote.findByIdAndDelete({
          _id: getCommentVote[0]._id,
        });
      }
      return res.send({ success: true });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.sendFollowRequest = async (req, res, next) => {
  const { from, to } = req.body;
  const user = res.locals.user;

  try {
    let fromId = from.fromId === null ? user._id : from.fromId;
    let toId = to.toId === null ? user._id : to.toId;
    let check = await FollowRequest.find({
      $and: [
        { "from.fromId": ObjectId(fromId) },
        { "to.toId": ObjectId(toId) },
      ],
    });
    if (check.length > 0) {
      return res.send({ success: true });
    } else {
      let storeFollowRequest = new FollowRequest({
        from: {
          fromType: from.fromType,
          fromId: fromId,
        },
        to: {
          toType: to.toType,
          toId: toId,
        },
      });
      await storeFollowRequest.save();
      return res.send({ success: true });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.getFollowRequests = async (req, res, next) => {
  try {
    const { to } = req.body;
    const user = res.locals.user;
    let getFollowRequests = await FollowRequest.find({
      $and: [{ "to.toId": ObjectId(to.toId) }, { confirmed: false }],
    });
    let finalData = [];
    for (let r1 of getFollowRequests) {
      let tempObj = { ...r1.toObject() };
      let userDetails;
      if (r1.from.fromType == "Animal") {
        userDetails = await Animal.findOne({ _id: ObjectId(r1.from.fromId) }).select('username name avatar');
      } else {
        userDetails = await User.findOne({ _id: ObjectId(r1.from.fromId) }).select('username fullName avatar');
      }
      tempObj.details = userDetails;
      finalData.push(tempObj);
      tempObj = {};
    }
    return res.send(finalData);
  } catch (err) {
    next(err);
  }
};

module.exports.acceptFollowRequests = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    let user=undefined;
    if(req.body.type=="human")
     user = res.locals.user
    else
     user = res.locals.animal
    let fromId = from.fromId === null ? user._id : from.fromId;
    let toId = to.toId === null ? user._id : to.toId;
    let check = await FollowRequest.find({
      $and: [
        { "from.fromId": ObjectId(fromId) },
        { "to.toId": ObjectId(toId) },
      ],
    });
    if (check.length > 0) {
      await FollowRequest.findByIdAndUpdate(
        { _id: check[0]._id },
        { confirmed: true }
      );
      let following = new Following({
        user: {
          id: ObjectId(fromId),
          userType: from.fromType,
        },
        followingDetails: {
          followingType: to.toType,
          followingId: toId,
        },
      });
      await following.save();

      let follower = new Followers({
        user: {
          id: toId,
          userType: to.toType,
        },
        followerDetails: {
          followerType: from.fromType,
          followerId: fromId,
        },
      });
      await follower.save();

      return res.send({ success: true });
    } else {
      return res.send({ success: true });
    }
  } catch (err) {
    next(err);
  }
};

// module.exports.votePost = async (req, res, next) => {
//   const { postId } = req.params;
//   const user = res.locals.user;

//   try {
//     // Update the vote array if the user has not already liked the post
//     const postLikeUpdate = await PostVote.updateOne(
//       { post: ObjectId(postId), voterId: { $ne: user._id } },
//       {
//         $push: { voterId: user._id },
//       }
//     );
//     if (!postLikeUpdate.nModified) {
//       if (!postLikeUpdate.ok) {
//         return res.status(500).send({ error: "Could not vote on the post." });
//       }
//       // Nothing was modified in the previous query meaning that the user has already liked the post
//       // Remove the user's like
//       const postDislikeUpdate = await PostVote.updateOne(
//         { post: ObjectId(postId) },
//         { $pull: { voterId: user._id } }
//       );

//       if (!postDislikeUpdate.nModified) {
//         return res.status(500).send({ error: "Could not vote on the post." });
//       }
//     } else {
//       // Sending a like notification
//       const post = await Post.findById(postId);
//       if (String(post.author) !== String(user._id)) {
//         // Create thumbnail link
//         const image = formatCloudinaryUrl(
//           post.image,
//           {
//             height: 50,
//             width: 50,
//           },
//           true
//         );
//         const notification = new Notification({
//           sender: user._id,
//           receiver: post.author,
//           notificationType: "like",
//           date: Date.now(),
//           notificationData: {
//             postId,
//             image,
//             filter: post.filter,
//           },
//         });

//         await notification.save();
//         socketHandler.sendNotification(req, {
//           ...notification.toObject(),
//           sender: {
//             _id: user._id,
//             username: user.username,
//             avatar: user.avatar,
//           },
//         });
//       }
//     }
//     return res.send({ success: true });
//   } catch (err) {
//     next(err);
//   }
// };

module.exports.retrievePostFeed = async (req, res, next) => {
  
  let user=undefined;
  if(req.headers.type=="User")
   user = res.locals.user
  else
   user = res.locals.animal
  const { counter } = req.body;

  try {
    const followingDocument = await Following.find({'user.id': user._id });
    if (!followingDocument) {
      // console.log(followingDocument)
      return res.status(404).send({ error: "Could not find any posts." });
    }
    // console.log(followingDocument+'looooo')

    // const following = followingDocument.map(
    //   (following) => followingDocument.followingDetails.followingId
    // );
let following =[]
for(let i=0;i<followingDocument.length;i++){
  following.push(followingDocument[i].followingDetails.followingId)
}
// following =[]
//  following.push(ObjectId('618a0d66e443a1dcaf4e4d8c'))
following.push(user._id)
following.push(ObjectId('6197b8b854bb630004ed1387'))
    // Fields to not include on the user object
    // console.log(following)
    const posts = await Post.aggregate([
      {
        $match: {
          $or: [{ Userauthor: { $in: following } }, { Animalauthor: { $in: following } }, { author: ObjectId(user._id) }],
        },
      },
      { $sort: { date: -1 } },
      { $skip: Number(counter)*5 },
      { $limit: 5 },
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
      // {
      //   $lookup: {
      //     from: "postvotes",
      //     let: { post: "$_id" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: ["$post", "$$post"],
      //           },
      //         },
      //       }
      //     ],
      //     // localField: "_id",
      //     // foreignField: "post",
      //     as: "postVotes",
      //   },
      // },
      {
        $lookup: {
          from: "postvotes",
          let: { post: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$post"],
                },
              },
            },
            {
              $group: { _id: null, count: { $sum: 1 } },
            },
            {
              $project: {
                _id: false,
              },
            },
          ],
          as: "votesCount",
        },
      },
      // {
      //   $unwind: {
      //     path: "$votesCount",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $addFields: {
      //     // postVotes: "$postVotes.votes",
      //     votesData: {
      //       votes: "$postVotes",
      //       votesCount: "$votesCount.count",
      //     },
      //   },
      // },
      // {
      //   $unwind:{
      //     path:  "$postVotes",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $addFields: {
      //     postVotes: "$postVotes",
      //   },
      // },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              // Finding comments related to the postId
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 3 },
            // Populating the author field
            {
              $lookup: {
                from: "users",
                localField: "Userauthor",
                foreignField: "_id",
                as: "Userauthor",
              },
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
              $lookup: {
                from: "commentvotes",
                localField: "_id",
                foreignField: "comment",
                as: "commentVotes",
              },
            },
            // {
            //   $unwind: "$author",
            // },
            {
              $unwind: {
                path: "$commentVotes",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unset: unwantedUserFields,
            },
            {
              $addFields: {
                commentVotes: "$commentVotes.votes",
              },
            },
          ],
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $group: { _id: null, count: { $sum: 1 } },
            },
            {
              $project: {
                _id: false,
              },
            },
          ],
          as: "commentCount",
        },
      },
      {
        $unwind: {
          path: "$commentCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $unwind: "$postVotes",
      // },
      // {
      //   $unwind: "$author",
      // },
      // {
      //   $unwind: "$authorAnimal",
      // },
      {
        $addFields: {
          // postVotes: "$postVotes.votes",
          commentData: {
            comments: "$comments",
            commentCount: "$commentCount.count",
          },
        },
      },
      {
        $unset: [...unwantedUserFields, "comments", "commentCount"],
      },
    ]);
    for (var i=0;i<posts.length;i++){
      if (posts[i].authorType == "Animal"){
        const animal_token = jwt.encode({ id: posts[i].Animalauthor[0]._id}, process.env.JWT_SECRET);
        posts[i]['Animalauthor'][0]['category'] = animal_token;
      }
    }
    if (req.headers.type=="User"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Uservoter' : ObjectId(user._id.toString())
        })
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.some((e) => {
          return e.post == posts[i]._id.toString()
        })
        posts[i].isBookmarked = isBookmark
      }
    }
    if (req.headers.type=="Animal"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Animalvoter' : ObjectId(user._id.toString())
        })
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.some((e) => {
          return e.post == posts[i]._id.toString()
        })
        posts[i].isBookmarked = isBookmark
      }
    }
    console.log(user.bookmarks)
    return res.send({posts:posts});
  } catch (err) {
    next(err);
  }
};

module.exports.retrieveSuggestedPosts = async (req, res, next) => {
  const { counter = 0 } = req.body;

  try {
    const posts = await Post.aggregate([
      {
        $sort: { date: -1 },
      },
      {
        $skip: Number(counter*20),
      },
      {
        $limit: 20,
      },
      {
        $sample: { size: 20 },
      },
      ...populatePostsPipeline,
    ]);
    return res.send(posts);
  } catch (err) {
    next(err);
  }
};

module.exports.retrievMyPosts = async (req, res, next) => {
  const { counter = 0 } = req.body;
  let obj = {}
  let user=undefined
  if(req.headers.type=="User"){
    user = res.locals.user
    obj = {'Userauthor' : user._id}
  }
  else
  {
    user = res.locals.animal
    obj = {'Animalauthor' : user._id}
  }
  try {
    const authorId = user._id;
    const posts = await Post.aggregate([
      // { $match: obj},
      {
        $match: {
          $or: [{ Userauthor: ObjectId(user._id)}, { Animalauthor:  ObjectId(user._id)}],
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $skip: Number(counter*20),
      },
      {
        $limit: 20,
      },
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
        $lookup: {
          from: "postvotes",
          let: { post: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$post"],
                },
              },
            },
            {
              $group: { _id: null, count: { $sum: 1 } },
            },
            {
              $project: {
                _id: false,
              },
            },
          ],
          as: "votesCount",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              // Finding comments related to the postId
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 3 },
            // Populating the author field
            {
              $lookup: {
                from: "users",
                localField: "Userauthor",
                foreignField: "_id",
                as: "Userauthor",
              },
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
              $lookup: {
                from: "commentvotes",
                localField: "_id",
                foreignField: "comment",
                as: "commentVotes",
              },
            },
            // {
            //   $unwind: "$author",
            // },
            {
              $unwind: {
                path: "$commentVotes",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unset: unwantedUserFields,
            },
            {
              $addFields: {
                commentVotes: "$commentVotes.votes",
              },
            },
          ],
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $group: { _id: null, count: { $sum: 1 } },
            },
            {
              $project: {
                _id: false,
              },
            },
          ],
          as: "commentCount",
        },
      },
      {
        $unwind: {
          path: "$commentCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          // postVotes: "$postVotes.votes",
          commentData: {
            comments: "$comments",
            commentCount: "$commentCount.count",
          },
        },
      },
      {
        $unset: [...unwantedUserFields, "comments", "commentCount"],
      },
    ]);
    console.log(posts)
    for (let p1 of posts) {
      let getPostVoteresp = await PostVote.aggregate([
        {
          $match: { post: p1._id },
        },
        {
          $count: "totalVotes",
        },
      ]);
      let getTotalCommentsResp = await Comment.aggregate([
        {
          $match: { post: p1._id },
        },
        {
          $count: "totalComments",
        },
      ]);
      p1.totalVotes =
        getPostVoteresp.length == 0 ? 0 : getPostVoteresp[0].totalVotes;
      p1.totalComments =
        getTotalCommentsResp.length == 0
          ? 0
          : getTotalCommentsResp[0].totalComments;
    }

    // const posts = await Post.aggregate([
    //   { $match: { author: authorId } },
    //   {
    //     $sort: { date: -1 },
    //   },
    //   {
    //     $skip: Number(offset),
    //   },
    //   {
    //     $limit: 20,
    //   },
    //   {
    //     $sample: { size: 20 },
    //   },
    //   ...populatePostsPipeline,
    // ]);
    if (req.headers.type=="User"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Uservoter' : ObjectId(user._id.toString())
        })
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.includes(posts[i]._id.toString())
        posts[i].isBookmarked = isBookmark
      }
    }
    if (req.headers.type=="Animal"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Animalvoter' : ObjectId(user._id.toString())
        })
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.includes(posts[i]._id.toString())
        posts[i].isBookmarked = isBookmark
      }
    }
    
    return res.send({"posts" : posts});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.retrieveHashtagPosts = async (req, res, next) => {
  const { hashtag } = req.params;
  const { counter } = req.body;

  try {
    const posts = await Post.aggregate([
      {
        $facet: {
          posts: [
            {
              $match: { hashtags: hashtag },
            },
            {
              $skip: Number(counter*20),
            },
            {
              $limit: 20,
            },
            ...populatePostsPipeline,
          ],
          postCount: [
            {
              $match: { hashtags: hashtag },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $unwind: "$postCount",
      },
      {
        $addFields: {
          postCount: "$postCount.count",
        },
      },
    ]);

    return res.send(posts[0]);
  } catch (err) {
    next(err);
  }
};




module.exports.foryoufeed = async (req, res, next) => {
  const user = res.locals.user;
  const { counter } = req.body;

  try {
    const posts = await Post.aggregate([
      // {
      //   $match: {
      //     $or: [{ Userauthor: { $in: following } }, { Animalauthor: { $in: following } }, { author: ObjectId(user._id) }],
      //   },
      // },
      { $sort: { date: -1 } },
      { $skip: Number(counter)*20 },
      { $limit: 20 },
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
      // {
      //   $lookup: {
      //     from: "postvotes",
      //     let: { post: "$_id" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: ["$post", "$$post"],
      //           },
      //         },
      //       }
      //     ],
      //     // localField: "_id",
      //     // foreignField: "post",
      //     as: "postVotes",
      //   },
      // },
      {
        $lookup: {
          from: "postvotes",
          let: { post: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$post"],
                },
              },
            },
            {
              $group: { _id: null, count: { $sum: 1 } },
            },
            {
              $project: {
                _id: false,
              },
            },
          ],
          as: "votesCount",
        },
      },
      // {
      //   $unwind: {
      //     path: "$votesCount",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $addFields: {
      //     // postVotes: "$postVotes.votes",
      //     votesData: {
      //       votes: "$postVotes",
      //       votesCount: "$votesCount.count",
      //     },
      //   },
      // },
      // {
      //   $unwind:{
      //     path:  "$postVotes",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $addFields: {
      //     postVotes: "$postVotes",
      //   },
      // },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              // Finding comments related to the postId
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 3 },
            // Populating the author field
            {
              $lookup: {
                from: "users",
                localField: "Userauthor",
                foreignField: "_id",
                as: "Userauthor",
              },
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
              $lookup: {
                from: "commentvotes",
                localField: "_id",
                foreignField: "comment",
                as: "commentVotes",
              },
            },
            // {
            //   $unwind: "$author",
            // },
            {
              $unwind: {
                path: "$commentVotes",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unset: unwantedUserFields,
            },
            {
              $addFields: {
                commentVotes: "$commentVotes.votes",
              },
            },
          ],
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $group: { _id: null, count: { $sum: 1 } },
            },
            {
              $project: {
                _id: false,
              },
            },
          ],
          as: "commentCount",
        },
      },
      {
        $unwind: {
          path: "$commentCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $unwind: "$postVotes",
      // },
      // {
      //   $unwind: "$author",
      // },
      // {
      //   $unwind: "$authorAnimal",
      // },
      {
        $addFields: {
          // postVotes: "$postVotes.votes",
          commentData: {
            comments: "$comments",
            commentCount: "$commentCount.count",
          },
        },
      },
      {
        $unset: [...unwantedUserFields, "comments", "commentCount"],
      },
    ]);
    for (var i=0;i<posts.length;i++){
      if (posts[i].authorType == "Animal"){
        // console.log(posts[i])
        const animal_token = jwt.encode({ id: posts[i].Animalauthor[0]._id}, process.env.JWT_SECRET);
        posts[i]['Animalauthor'][0]['category'] = animal_token;
      }
    }
    if (req.headers.type=="User"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Uservoter' : ObjectId(user._id.toString())
        })
        // console.log(like)
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.includes(posts[i]._id.toString())
        posts[i].isBookmarked = isBookmark
      }
    }
    if (req.headers.type=="Animal"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Animalvoter' : ObjectId(user._id.toString())
        })
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.includes(posts[i]._id.toString())
        posts[i].isBookmarked = isBookmark
      }
    }
    return res.send({posts:posts});
  } catch (err) {
    next(err);
  }
};

module.exports.follow = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    let user=undefined;
    if(req.headers.type=="User")
     user = res.locals.user
    else
     user = res.locals.animal 
    //  console.log(user._id)
    if (from.fromType === "Animal"){
      let found = false;
      // for (var i=0; i<user.pets.length;i++){
      //   if (user.pets[i].pet == from.fromId){
      //     found = true;
      //   }
      // }
      if(from.fromId==user._id.toString())
        found =true;
      if (!found){
        return res.status(401).send({error: "You are not authorized!"})
      }
    }
    if (user._id.toString() != from.fromId && from.fromType === "User") {
      return res.status(401).send({error: "You are not authorized!"})
    }
    let fromId = from.fromId === null ? user._id : from.fromId;
    let toId = to.toId === null ? user._id : to.toId;
    if (fromId === toId && from.fromType === to.toType){
      res.status(400).send({error: "You can't follow yourself!"})
    }
    let check = await Followers.findOne({
      $and: [
        { "user.id": ObjectId(toId) },
        { "followerDetails.followerId": ObjectId(fromId) },
      ],
    });
    if (check) {
      return res.status(200).send({ message: "You are already following the given user!" });
    } else {
      const followerDocument = new Followers({
        "user.id" : ObjectId(toId),
        "followerDetails.followerId": ObjectId(fromId),
        "user.userType" : to.toType,
        "followerDetails.followerType" : from.fromType 
      });
      const followingDocument = new Following({
        "user.id" : ObjectId(fromId),
        "followingDetails.followingId": ObjectId(toId),
        "user.userType" : from.fromType,
        "followingDetails.followingType" : to.toType 
      });
      await followerDocument.save();
      await followingDocument.save();
      res.send({ success: true });
      const isUser = User.findOne({_id : ObjectId(toId)}, '_id username');
      if (isUser){
        let title = 'Tamely'
        let body = `${user.username} just followed you!🥳`
        let channel = 'tamelyid';
        // let image = formatCloudinaryUrl(
        //   post.image,
        //   { height: 256, width: 512, x: '100%', y: '100%' },
        //   true
        // );
        const obj = {title, body}
        notifyUser(obj,channel,user._id);  
        }
        else{
          const animalDoc = await Animal.findOne({id : ObjectId(toId)}, '_id username')
          let obj = {
            title : 'Tamely',
            body : `${user.username} just followed ${animalDoc.username}!🥳`,
            // image : formatCloudinaryUrl(
            //   post.image,
            //   { height: 256, width: 512, x: '100%', y: '100%' },
            //   true
            // ),
          }
          notifyAnimal(obj,'tamelyid',user._id);   
        }
    }
  } catch (err) {
    next(err);
  }
}

module.exports.retrievePostlikes = async (req, res, next) => {
  const { postId } = req.body;
  const user = res.locals.user;

  try {
    const postlikes = await PostVote.find({ post: postId}).populate('voterDetails.Uservoter','_id name username avatar').populate('voterDetails.Animalvoter','_id name username avatar');
    if (!postlikes) {
      return res.status(404).send({
        error: "Could not find likes with that postid",
      });
    }
  console.log(postId)
    return res.send({postlikes});
  } catch (err) {
    next(err);
  }
};

module.exports.deleteNullPostVotes = async (req, res, next) => {
  try{
    const result = await PostVote.deleteMany({"voterDetails" : null});
    return res.status(200).send({ success: true });
  }
  catch(err){
    console.log(err);
    next(err)
  }
}

module.exports.getPostsById = async (req, res, next) => {
    const {id,type, counter = 0} = req.body;
    let user = null;
    if (type == "User"){
      user = await User.findById(id, '_id bookmarks')
    }
    else{
      user = await Animal.findById(id, '_id bookmarks')
    }
    const posts = await Post.aggregate([
      {
        $match: {
          $or: [{ Userauthor: ObjectId(user._id)}, { Animalauthor:  ObjectId(user._id)}],
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $skip: Number(counter*20),
      },
      {
        $limit: 20,
      },
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
    ]);
    for (let p1 of posts) {
      let getPostVoteresp = await PostVote.aggregate([
        {
          $match: { post: p1._id },
        },
        {
          $count: "totalVotes",
        },
      ]);
      let getTotalCommentsResp = await Comment.aggregate([
        {
          $match: { post: p1._id },
        },
        {
          $count: "totalComments",
        },
      ]);
      p1.totalVotes =
        getPostVoteresp.length == 0 ? 0 : getPostVoteresp[0].totalVotes;
      p1.totalComments =
        getTotalCommentsResp.length == 0
          ? 0
          : getTotalCommentsResp[0].totalComments;
    }
    if (req.headers.type=="User"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Uservoter' : ObjectId(user._id.toString())
        })
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.includes(posts[i]._id.toString())
        posts[i].isBookmarked = isBookmark
      }
    }
    if (req.headers.type=="Animal"){
      for (var i=0;i<posts.length;i++){
        const like = await PostVote.findOne({
            'post' : ObjectId(posts[i]._id.toString()),
            'voterDetails.Animalvoter' : ObjectId(user._id.toString())
        })
        if (like){
          posts[i].isLiked = true;
        }
        else{
          posts[i].isLiked = false;
        }
        const isBookmark = user.bookmarks.includes(posts[i]._id.toString())
        posts[i].isBookmarked = isBookmark
      }
    }
    
    return res.send({"posts" : posts});
}

module.exports.deletePost = async (req, res, next) => {
  const {postId} = req.body;
  let user = null;
  try{
    if (req.headers.type=="User")
      user = res.locals.user;
    else
      user = res.locals.animal
    const post = await Post.findById(postId, 'authorType Animalauthor Userauthor');
    console.log(post)
    if (!post){
      return res.status(404).send({"message" : "No such post found!" , "success" : false});
    }
    if (post.authorType != req.headers.type){
      return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
    }
    if (req.headers.type==post.authorType){
      console.log(user._id)
      if (post.authorType == "User"){
        if (user._id.toString() == post.Userauthor.toString()){
          await Post.deleteOne({"_id" : ObjectId(postId)});
          return res.status(200).send({"message" : "Post was deleted successfully!", "success" : true})
        }
        else{
          return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
      }
      if (post.authorType == "Animal"){
        if (user._id.toString() == post.Animalauthor.toString()){
          await Post.deleteOne({"_id" : ObjectId(postId)});
          return res.status(200).send({"message" : "Post was deleted successfully!", "success" : true})
        }
        else{
          return res.status(403).send({"message" : "You dont have required permissions", "success" : false});
        }
      }
    }
    return res.status(400).send({"message" : "Something went wrong!", "success" : false});
  }
  catch (err){
    console.log(err)
    next(err)
  }
}
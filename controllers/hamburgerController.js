const Post = require("../models/Post");
const Comment = require("../models/Comment");
const PostVote = require("../models/PostVote");
const Animal = require("../models/Animal");
const ServiceBooking = require("../models/ServiceBooking");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Feedback = require('../models/Feedback');

module.exports.getBookmarks = async (req, res, next) => {
    const { offset = 0 } = req.params;
    const user = res.locals.user;
  try {
    const bookmarkIDs = [];
    for (var i=0; i<user.bookmarks.length;i++){
      bookmarkIDs[i] = user.bookmarks[i].post;
    }
  
    const bookmarks = await Post.aggregate([
      { $match: { _id : {$in : bookmarkIDs}} },
      {
        $sort: { date: -1 },
      },
      {
        $skip: Number(offset),
      },
      {
        $limit: 20,
      },
    ]);
    for (let b of bookmarks) {
      let getPostVoteresp = await PostVote.aggregate([
        {
          $match: { post: b.post },
        },
        {
          $count: "totalVotes",
        },
      ]);
      let getTotalCommentsResp = await Comment.aggregate([
        {
          $match: { post: b.post },
        },
        {
          $count: "totalComments",
        },
      ]);
      b.totalVotes =
        getPostVoteresp.length == 0 ? 0 : getPostVoteresp[0].totalVotes;
      b.totalComments =
        getTotalCommentsResp.length == 0
          ? 0
          : getTotalCommentsResp[0].totalComments;
    }
    return res.send({"bookmarks": bookmarks});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.submitFeedback = async (req, res, next) => {
  const user = res.locals.user;
  const {rating, tags, description, screenshot} = req.body;

  if (!rating && !tags && !description && !screenshot) {
      return res.send({error: 'Please submit a valid feedback!'})
  }
  try {
      const feedbackDocument = new Feedback({
          rating: Number(rating),
          tags,
          description,
          screenshot,
          author: user._id
      });
      await feedbackDocument.save();
      return res.status(201).send({"message": "Feedback submitted successfully!"})
  }
  catch (err) {
      console.log(err);
      next(err);
  }
}
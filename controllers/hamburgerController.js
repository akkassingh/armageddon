const Post = require("../models/Post");
const Comment = require("../models/Comment");
const PostVote = require("../models/PostVote");
const Animal = require("../models/Animal");
const ServiceBooking = require("../models/ServiceBooking");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Feedback = require('../models/Feedback');
const {bookingDetails} = require("../models/ServiceBooking");
const {ServiceAppointment}=require("../models/Service");
const Help = require('../models/Help');

module.exports.getBookmarks = async (req, res, next) => {
    const { counter = 0 } = req.body;
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
        $skip: Number(counter*20),
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
module.exports.getBookings = async (req, res, next) => {
  try {
    let serviceList1=[]
    let serviceList = await bookingDetails.find({
      User: res.locals.user._id //recieved=0,accepted(confirmed=1).rejected(cancelled)=2,completed=3
    }).sort({start:1});
    for(let i=0;i<serviceList.length;i++){
      let obj= await ServiceAppointment.findOne({
        bookingDetails: serviceList[i]._id,
        bookingStatus:0
      }).populate('bookingDetails','package run1 run2 startDate dayOff').populate('petDetails', 'name username'); 
      if(obj!=null)
      serviceList1.push(obj);
    }   
  
    return res.status(200).json({serviceList:serviceList1});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getHelp = async (req, res, next) => {
  const user = res.locals.user;
  const {phoneNumber,email,description,screenshot} = req.body;
  if (!phoneNumber && !email && !description && !screenshot){
    return res.send({error:"Please send a valid request!"})
  }
  try {
    const helpDocument = new Help({
      phoneNumber,
      email,
      description,
      screenshot,
      author: user._id
    });
    await helpDocument.save();
    return res.status(201).send({"message": "Your issue has been noted! Our support team will contact you within 24 hours!"})
  }
  catch (err){
    console.log(err);
    next(err);
  }
}

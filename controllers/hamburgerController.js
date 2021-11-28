const Post = require("../models/Post");
const Comment = require("../models/Comment");
const PostVote = require("../models/PostVote");
const Animal = require("../models/Animal");
const ServiceBooking = require("../models/ServiceBooking");
const {bookingDetails} = require("../models/ServiceBooking");
const {ServiceAppointment}=require("../models/Service")

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
const express = require("express");
const postRouter = express.Router();
const multer = require("multer");
const upload = multer({
  dest: "temp/",
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("image");
const rateLimit = require("express-rate-limit");

const { requireAuth } = require("../controllers/authController");
const {
  createPost,
  retrievePost,
  votePost,
  deletePost,
  retrievePostFeed,
  retrieveSuggestedPosts,
  retrievMyPosts,
  retrieveHashtagPosts,
  postComment,
  editComment,
  deleteComment,
  postSubComment,
  editSubComment,
  deleteSubComment,
  postCommentVote,
  postSubCommentVote,
  sendFollowRequest,
  getFollowRequests,
  acceptFollowRequests,
  foryoufeed,
  follow,
  retrievePostlikes
} = require("../controllers/postController");
const filters = require("../utils/filters");

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

postRouter.post("/", postLimiter, requireAuth, upload, createPost);
postRouter.post("/myPosts", requireAuth, retrievMyPosts);
postRouter.post("/suggested", requireAuth, retrieveSuggestedPosts);
postRouter.post("/vote", requireAuth, votePost);
postRouter.post("/foryoufeed", requireAuth, foryoufeed);

postRouter.get("/filters", (req, res) => {
  res.send({ filters });
});
postRouter.get("/:postId", retrievePost);
postRouter.post("/feed", requireAuth, retrievePostFeed);
postRouter.post("/hashtag/:hashtag", requireAuth, retrieveHashtagPosts);

postRouter.delete("/post", requireAuth, deletePost);

//------------COMMENTS-------------------------------------
postRouter.post("/comment", requireAuth, postComment);
postRouter.put("/comment", requireAuth, editComment);
postRouter.delete("/comment", requireAuth, deleteComment);

//----------SUB COMMENTS-----------------------------------------------
postRouter.post("/subcomment", requireAuth, postSubComment);
postRouter.put("/subcomment", requireAuth, editSubComment);
postRouter.delete("/subcomment", requireAuth, deleteSubComment);

//------COMMENT VOTES--------------------------------------------------
postRouter.post("/commentVote", requireAuth, postCommentVote);

//------SUB COMMENT VOTES----------------------------------------------
postRouter.post("/subcommentVote", requireAuth, postSubCommentVote);

//------SEND AND FETCH FOLLOW REQESTS----------------------------------
postRouter.post("/sendfollowrequest", requireAuth, sendFollowRequest);
postRouter.post("/getfollowrequests", requireAuth, getFollowRequests);
postRouter.post("/acceptfollowrequests", requireAuth, acceptFollowRequests);
postRouter.post("/follow",requireAuth, follow);

//------POST VOTES----------------------------------------------
postRouter.post("/retrievePostlikes", requireAuth, retrievePostlikes);



module.exports = postRouter;

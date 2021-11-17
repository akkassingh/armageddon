const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentVoteSchema = new Schema({
  commentId: {
    type: Schema.ObjectId,
    ref: "Comment",
  },
  voterDetails: {
    voterType: {
      type: String,
      enum: ["Animal", "Human"],
    },
    voterId: Schema.ObjectId,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const commentVoteModel = mongoose.model("CommentVote", CommentVoteSchema);
module.exports = commentVoteModel;

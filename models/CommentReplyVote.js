const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentReplyVoteSchema = new Schema({
  comment: {
    type: Schema.ObjectId,
    ref: "CommentReply",
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

const commentReplyVoteModel = mongoose.model(
  "CommentReplyVote",
  CommentReplyVoteSchema
);
module.exports = commentReplyVoteModel;

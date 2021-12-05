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
      enum: ["Animal", "User"],
    },
    voterId: {
      type: Schema.ObjectId,
      refPath: "voterDetails.voterType"
    }
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

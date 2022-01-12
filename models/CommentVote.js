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
},
{
  timestamps: true
});

const commentVoteModel = mongoose.model("CommentVote", CommentVoteSchema);
module.exports = commentVoteModel;

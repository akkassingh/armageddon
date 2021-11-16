const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostVoteSchema = new Schema({
  post: {
    type: Schema.ObjectId,
    ref: "Post",
  },
  voterDetails: {
    voterType: {
      type: String,
      enum: ["Animal", "Human"],
    },
    voterId: Schema.ObjectId,
  },
});

const postVoteModel = mongoose.model("PostVote", PostVoteSchema);

module.exports = postVoteModel;

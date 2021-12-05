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
      enum: ["Animal", "User"],
    },
    voterId: {
      type: Schema.ObjectId,
      refPath: "voterDetails.voterType"
    }
  },
});

const postVoteModel = mongoose.model("PostVote", PostVoteSchema);

module.exports = postVoteModel;

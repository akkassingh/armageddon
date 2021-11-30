const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostVoteSchema = new Schema({
  post: {
    type: Schema.ObjectId,
    ref: "Post",
  },
  voterDetails: {
    Animalvoter:  {
      type: Schema.ObjectId,
      ref: "Animal",
    },
    Uservoter:  {
      type: Schema.ObjectId,
      ref: "User",
    },
    voterType:String,
  },
});

const postVoteModel = mongoose.model("PostVote", PostVoteSchema);

module.exports = postVoteModel;

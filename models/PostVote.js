const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostVoteSchema = new Schema({
  post: {
    type: Schema.ObjectId,
    ref: "Post",
    index : true,
  },
  voterDetails: {
    Animalvoter:  {
      type: Schema.ObjectId,
      ref: "Animal",
      index: true,
    },
    Uservoter:  {
      type: Schema.ObjectId,
      ref: "User",
      index: true,
    },
    voterType:String,
  },
},
{
  timestamps: true
});

const postVoteModel = mongoose.model("PostVote", PostVoteSchema);

module.exports = postVoteModel;

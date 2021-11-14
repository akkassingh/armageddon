const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FollowersSchema = new Schema({
  user: {
    id: {
      type: String,
      required: true,
    },
    userType: { required: true, type: String, enum: ["Animal", "Human"] },
  },
  followerDetails: [
    {
      followerType: {
        type: String,
        enum: ["Animal", "Human"],
      },
      followerId: Schema.ObjectId,
    },
  ],
});

const followersModel = mongoose.model("Followers", FollowersSchema);
module.exports = followersModel;

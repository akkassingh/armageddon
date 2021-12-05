const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FollowersSchema = new Schema({
  user: {
    id: {
      type: Schema.ObjectId,
      required: true,
    },
    userType: { required: true, type: String, enum: ["Animal", "User"] },
  },
  followerDetails: {
    followerType: {
      type: String,
      enum: ["Animal", "User"],
    },
    followerId: {
      type: Schema.ObjectId,
      refPath: 'followerDetails.followerType'
    }
  },
});

const followersModel = mongoose.model("Followers", FollowersSchema);
module.exports = followersModel;

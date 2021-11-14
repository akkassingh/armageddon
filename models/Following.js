const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FollowingSchema = new Schema({
  user: {
    id: {
      type: String,
      required: true,
    },
    userType: { required: true, type: String, enum: ["Animal", "Human"] },
  },
  followingDetails: [
    {
      followingType: {
        type: String,
        enum: ["Animal", "Human"],
      },
      followingId: Schema.ObjectId,
    },
  ],
});

const followingModel = mongoose.model("Following", FollowingSchema);
module.exports = followingModel;

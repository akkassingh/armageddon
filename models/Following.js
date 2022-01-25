const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FollowingSchema = new Schema({
  user: {
    id: {
      type: Schema.ObjectId,
      required: true,
    },
    userType: { required: true, type: String, enum: ["Animal", "User"] },
  },
  followingDetails: {
    followingType: {
      type: String,
      enum: ["Animal", "User"],
    },
    followingId: {
      type: Schema.ObjectId,
      refPath: 'followingDetails.followingType'
    }
  },
},
{
  timestamps: true
});

const followingModel = mongoose.model("Following", FollowingSchema);
module.exports = followingModel;

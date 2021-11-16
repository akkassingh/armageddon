const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FollowRequestSchema = new Schema({
  from: {
    fromType: {
      type: String,
      enum: ["Animal", "Human"],
    },
    fromId: Schema.ObjectId,
  },
  to: {
    toType: {
      type: String,
      enum: ["Animal", "Human"],
    },
    toId: Schema.ObjectId,
  },
  confirmed: { type: Boolean, default: false },
});

const followRequestModel = mongoose.model("FollowRequest", FollowRequestSchema);
module.exports = followRequestModel;

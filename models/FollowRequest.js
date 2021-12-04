const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FollowRequestSchema = new Schema({
  from: {
    fromType: {
      type: String,
      enum: ["Animal", "User"],
    },
    fromId: {
      type: Schema.ObjectId,
      refPath: "from.fromType"
    }
  },
  to: {
    toType: {
      type: String,
      enum: ["Animal", "User"],
    },
    toId: {
      type: Schema.ObjectId,
      refPath: "to.toType"
    }
  },
  confirmed: { type: Boolean, default: false },
});

const followRequestModel = mongoose.model("FollowRequest", FollowRequestSchema);
module.exports = followRequestModel;

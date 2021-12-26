const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const GroupSchema = new Schema({
    name : {
        type: String,
        required : true,
    },
    coverPhoto : String,
    description: {
        type : String,
        default : "",
    },
    members :  {
        type : Number,
        default : 1
    },
    avatar: String,
    date: {
        type: Date,
        default: Date.now,
    },
    hashtags: [String],
    private: {
        type: Boolean,
        default: false,
    },
});

GroupSchema.pre("deleteOne", async function (next) {
    const groupId = this.getQuery()["_id"];
    try {
      await mongoose.model("GroupMember").deleteMany({ group: groupId });
      next();
    } catch (err) {
      next(err);
    }
});
  

const Group = mongoose.model("Group", GroupSchema);
module.exports = Group;
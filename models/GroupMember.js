const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const GroupMemberSchema = new Schema({
    user : {
        type : Schema.ObjectId,
        refPath : "userType",
        index : true,
        required : true,
    },
    userType:{
        type: String,
        required : true,
        enum: ["Animal", "User"]
    },
    group: {
        type : Schema.ObjectId,
        ref : "Group",
        index: true,
        required : true,
    },
    confirmed : {
        type : Boolean,
        default: false,
    },
    isAdmin:{
        type: Boolean,
        default: false
    },
    date:{
        type : Date,
        default : Date.now,
    },
    personInvited : {
        type : Schema.ObjectId,
        refPath : "personType"
    },
    personType:{
        type: String,
        enum: ["Animal", "User"]
    }
},
{
  timestamps: true
});

const GroupMember = mongoose.model("GroupMember", GroupMemberSchema);
module.exports = GroupMember;
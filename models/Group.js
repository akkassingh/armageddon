const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const GroupSchema = new Schema({
    name : {
        type: String,
        required : true,
    },
    description: String,
    size :  Number,
    avatar: String,
    date: {
        type: Date,
        default: Date.now,
    }
    admin : [{
        person : {
            type: Schema.ObjectId,
            refPath: "admin.personType"
        },
        personType:{
            type: String,
            enum: ["Animal", "User"]
        },
    }],
    members: [{
        person : {
            type: Schema.ObjectId,
            refPath: "members.personType"
        },
        personType:{
            type: String,
            enum: ["Animal", "User"]
        },
    }],
    moderators: [{
        person : {
            type: Schema.ObjectId,
            refPath: "moderators.personType"
        },
        personType:{
            type: String,
            enum: ["Animal", "User"]
        },
    }],
    private: {
        type: Boolean,
        default: false,
    },
})
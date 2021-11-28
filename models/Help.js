const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const HelpSchema = new Schema({
    phoneNumber: String,
    email: String,
    description: String,
    screenshot: String,
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

const Help = mongoose.model("Help", HelpSchema);
module.exports = Help;
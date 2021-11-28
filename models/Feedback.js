const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const FeedbackSchema = new Schema({
    rating: Number,
    tags: [String],
    description: String,
    screenshot: String,
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

const Feedback = mongoose.model("Feedback", FeedbackSchema);
module.exports = Feedback;

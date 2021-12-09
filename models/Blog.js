const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlogSchema = new Schema({
    date: {
        type: Date,
        default: Date.now,
    },
    thumbnail: String,
    images: [String],
    authorType: {
        type: String,
        enum: ["Animal", "User"]
    },
    author: {
        type: Schema.ObjectId,
        refPath: "authorType"
    },
    text: String,
    title: String,
    likes: {
        type: Number,
        default: 0,
    }
    peopleLiked: [
        {
            id:{
               type: Schema.ObjectId,
               refPath: 'personType'
            }
            personType:{
                type: String,
                enum: ["Animal", "User"]
            },
        }
    ]
});

const Blog = mongoose.model("Blog", BlogSchema);
module.exports = Blog;
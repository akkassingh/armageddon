const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  image: String,
  filter: String,
  thumbnail: String,
  caption: String,
  hashtags: [
    {
      type: String,
      lowercase: true,
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
  Animalauthor:  {
    type: Schema.ObjectId,
    ref: "Animal",
  },
  Userauthor:  {
    type: Schema.ObjectId,
    ref: "User",
  },
  authorType:String,
  group : {
    type : Schema.ObjectId,
    ref : "Group",
  }
  // postOwnerDetails: {
  //   postOwnerId: String,
  //   postOwnerType: {
  //     type: String,
  //     enum: ["Animal", "Human"],
  //   },
  // },
});

PostSchema.pre("deleteOne", async function (next) {
  const postId = this.getQuery()["_id"];
  try {
    await mongoose.model("PostVote").deleteMany({ post: postId });
    await mongoose.model("Comment").deleteMany({ post: postId });
    next();
  } catch (err) {
    next(err);
  }
});

const postModel = mongoose.model("Post", PostSchema);
module.exports = postModel;

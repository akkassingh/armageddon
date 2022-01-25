const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  message: String,
  Animalauthor:  {
    type: Schema.ObjectId,
    index : true,
    ref: "Animal",
  },
  Userauthor:  {
    type: Schema.ObjectId,
    ref: "User",
    index : true,
  },
  authorType:String,
  post: {
    type: Schema.ObjectId,
    ref: "Post",
    index : true,
  },
},
{
  timestamps: true
});

CommentSchema.pre("deleteOne", async function (next) {
  const commentId = this.getQuery()["_id"];
  try {
    await mongoose.model("CommentVote").deleteMany({ commentId: commentId });
    await mongoose
      .model("CommentReply")
      .deleteMany({ parentComment: commentId });
    let getSubComments = await mongoose
      .model("CommentReply")
      .find({ parentComment: commentId });
    let subCommentIds = getSubComments.map((subCom) => subCom._id);
    await mongoose.model("CommentReplyVote").deleteMany({
      comment: { $in: subCommentIds },
    });
    next();
  } catch (err) {
    next(err);
  }
});

CommentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // await mongoose.model("CommentVote").create({ comment: this._id });
      next();
    } catch (err) {
      next(err);
    }
  }
  next();
});

const commentModel = mongoose.model("Comment", CommentSchema);
module.exports = commentModel;

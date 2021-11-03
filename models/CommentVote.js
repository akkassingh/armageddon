const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentVoteSchema = new Schema({
  comment: {
    type: Schema.ObjectId,
    ref: 'Comment'
  },
  // userType: {
  //   type: String,
  //   required: true,
  // },
  // voter: {
  //   type: Schema.ObjectId,
  //   ref: 'userType'
  // },
  votes: [
    {
      author: {
        type: Schema.ObjectId,
        ref: 'User'
      }
    }
  ]
});

const commentVoteModel = mongoose.model('CommentVote', CommentVoteSchema);
module.exports = commentVoteModel;

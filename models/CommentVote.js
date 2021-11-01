const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentVoteSchema = new Schema({
  comment: {
    type: Schema.ObjectId,
    ref: 'Comment'
  },
  //TODO : change the format to {commentid: userid}
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

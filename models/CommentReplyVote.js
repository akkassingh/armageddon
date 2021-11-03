const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentReplyVoteSchema = new Schema({
  comment: {
    type: Schema.ObjectId,
    ref: 'CommentReply'
  },
  //TODO : change the format to {commentid: userid}
  // userType: {
  //   type: String,
  //   required: true,
  // },
  // voter: {
  //   type: Schema.ObjectId,
  //   ref: 'userType',
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

const commentReplyVoteModel = mongoose.model(
  'CommentReplyVote',
  CommentReplyVoteSchema
);
module.exports = commentReplyVoteModel;

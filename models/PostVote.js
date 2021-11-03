const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostVoteSchema = new Schema({
  post: {
    type: Schema.ObjectId,
    ref: 'Post'
  },
  // userType: {
  //   type: String,
  //   required: true,
  // }
  // voter: {
  //   type: Schema.ObjectId,
  //   ref: 'userType',
  // }
  votes: [{ author: { type: Schema.ObjectId, ref: 'User' } }]
});

const postVoteModel = mongoose.model('PostVote', PostVoteSchema);

module.exports = postVoteModel;

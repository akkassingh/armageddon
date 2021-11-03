const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowersSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  // userType: {
  //   type: String,
  //   required: true,
  // },
  // follower: {
  //   type: Schema.ObjectId,
  //   ref: 'userType',
  // },
  followers: [
    {
      user: {
        type: Schema.ObjectId,
        ref: 'User'
      }
    }
  ]
});

const followersModel = mongoose.model('Followers', FollowersSchema);
module.exports = followersModel;

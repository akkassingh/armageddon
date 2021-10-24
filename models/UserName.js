const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserNameSchema = new Schema({
    username: String,
    current_num: Number
});

const UserName = mongoose.model('UserName', UserNameSchema);
module.exports = UserName;
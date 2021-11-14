const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConfirmationTokenSchema = new Schema({
  user: Schema.ObjectId,
  token: String,
  timestamp: Number,
  timestampreset: Number,
  resettoken: String,
});

const ConfirmationTokenModel = mongoose.model(
  "ConfirmationToken",
  ConfirmationTokenSchema
);

module.exports = ConfirmationTokenModel;

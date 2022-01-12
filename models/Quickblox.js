const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuickbloxSchema = new Schema({
    userLogin: String,
    userPassword: String,
    partnerLogin: String,
    partnerPassword: String,
    userChatID: Number,
    partnerChatID: Number,
    dialogID: String,
   
});

const Quickblox = mongoose.model("Quickblox", QuickbloxSchema);
module.exports = Quickblox;
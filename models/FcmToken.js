const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FcmTokenSchema = new Schema({

    token : String,
    user : {
        type : Schema.ObjectId,
        refPath : 'userType',
        index: true,
    },
    userType : {
        type : String,
        enum : ['User', 'ServiceProvider'],
    }
});


const FcmToken = mongoose.model("FcmToken", FcmTokenSchema);
module.exports = FcmToken;
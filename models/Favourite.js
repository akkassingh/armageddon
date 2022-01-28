const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FavouriteSchema = new Schema({
    products : {
        type : Map, //key will store productid and value will store the number of items 
        // keys are always strings. You specify the type of values using `of`
        of : Number
    },
    user : {
        type : Schema.ObjectId,
        ref : 'User',
        index : true
    }
},
{
    timestamps: true,
});

const Favourite = mongoose.model("Favourite", FavouriteSchema);
module.exports = Favourite;
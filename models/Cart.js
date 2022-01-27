const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new Schema({
    products : {
        type : Map, //key will store productid and value will store the number of items 
        of : String,
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

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
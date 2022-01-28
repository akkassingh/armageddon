const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new Schema({
    products : {
        type : Map, //key will store productid and value will store the number of items 
        // keys are always strings. You specify the type of values using `of`
        of : new Schema({
            quantity: Number,
            product: {
              type: Schema.ObjectId,
              ref: 'Product'
            },
            variation : {
                type : Map,
                of : Number
            }
          })
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
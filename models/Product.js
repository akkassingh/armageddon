const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const ProductSchema = new Schema({
    category : String,
    avatar: String,
    images : [String],
    name : String,
    brand : String,
    description : String,
    originalPrice : Number,
    discountedPrice : Number,
    rating : Number,
    sizes : [String],
},
{
    timestamps: true,
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
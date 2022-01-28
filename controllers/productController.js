const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Favourite = require('../models/Favourite');
const cloudinary = require("cloudinary").v2;
const fs = require("fs");


module.exports.addProduct = async (req, res, next) => {
    // const {category,name,brand,description,originalPrice,discountedPrice,rating,sizes} = req.body;
    try{
        let images = null;
        let avatar = null;
        if (req.files){
            images = [];
            for (let fl of req.files) {
            const response = await cloudinary.uploader.upload(fl.path);
            images.push(response.secure_url);
            fs.unlinkSync(fl.path);
            }
            if (images) avatar = images[0];
        }

        const product = new Product({...req.body, images, avatar});
        await product.save();
        return res.status(201).send({"message" : "Product uploaded successfully!", "success" : true});
    }
    catch (err){
        console.log(err);
        next(err);
    }
}


module.exports.getProducts = async (req, res, next) => {
    const {counter} = req.body;
    try{
        const products = await Product.find({}).skip(10*counter).limit(10);
        return res.status(200).send({products});
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports.addToCart = async (req, res, next) => {
    const user = res.locals.user;
    const {productId, variation} = req.body;
    if (!productId) return res.status(401).send({ error : 'Please provide a valid product for adding it to cart'})
    try {
        let cart = await Cart.findOne({user : user._id}, {user : 0});
        if (cart){
            if (cart.products.get(productId)){
                let old_num = cart.products.get(productId).quantity;
                if (cart.products.get(productId).variation.get(variation)){
                    var oldv = cart.products.get(productId).variation.get(variation)
                    cart.products.get(productId).variation.set(variation, oldv+1)
                }
                else{
                    cart.products.get(productId).variation.set(variation,1);
                }
                cart.products.set(productId , {quantity : old_num + 1, product : productId, variation : cart.products.get(productId).variation});
            }
            else{
                cart.products.set(productId, {quantity : 1, product : productId});
                cart.products.get(productId).variation.set(variation,1);
            }
            await Cart.updateOne({ _id : cart._id}, {products : cart.products});
        }
        else{
            let obj = {
                quantity : 1,
                product : productId,
                variation : { [variation] : 1}
            }
            var newCart = new Cart({
                user : user._id,
                products : {[productId] : obj}
            });
            await newCart.save();
        }
        return res.status(200).send({message : "Product added to cart successfully!", success : true});
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.getCartDetails = async (req, res, next) => {
    const user = res.locals.user;
    try{
        const cart = await Cart.findOne({user : user._id}, {user: 0}).populate('products.$*.product', 'name brand weight images avatar originalPrice discountedPrice').lean();
        res.status(200).send(cart)
    }
    catch (err){
        console.log(err)
        next(err)
    }
}
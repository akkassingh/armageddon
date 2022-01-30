const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Favourite = require('../models/Favourite');
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;


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
    const user = res.locals.user;
    try{
        const products = await Product.find({}).skip(10*counter).limit(10).lean();
        for (var i=0;i<products.length;i++){
            let isFav = false;
            var id = products[i]._id;
            let fav = await Favourite.findOne({user : user._id}, 'products');
            if (fav && fav.products.get(id)) isFav = true;

            let isCarted = false;
            let cart = await Cart.findOne({user : user._id}, 'products');
            if (cart && cart.products.get(id)) isCarted = true;

            products[i].isFav = isFav;
            products[i].isCarted = isCarted;
        }
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

module.exports.addToFavourites = async (req, res, next) => {
    const user = res.locals.user;
    const {productId} = req.body;
    if (!productId) res.status(400).send({error : 'Please select a valid product to add it in favourites'})
    try{
        const favourites = await Favourite.findOne({user : user._id});
        if (favourites){
            if (favourites.products.get(productId)) {
                return res.status(200).send({message : 'Item already marked as favourite!', success : false})
            }
            else{
                favourites.products.set(productId, {product : ObjectId(productId)});
            }
        }
        else{
            const newFav = new Favourite({
                user : user._id,
                products : {
                   [productId] : {product : ObjectId(productId)}
                }
            });
            await newFav.save();
        }
        return res.status(200).send({message : 'Item added to favourites', success : true})

    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.getFavouriteDetails = async (req, res, next) => {
    const user = res.locals.user;
    try{
        const fav = await Favourite.findOne({user : user._id}, {user: 0}).populate('products.$*.product', 'name brand weight images avatar originalPrice discountedPrice').lean();
        return res.status(200).send({fav});
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.getProductDetails = async (req, res, next) => {
    const {productId} = req.body;
    const user = res.locals.user;
    if (!productId || !user) return res.status(404).send({error : 'Invalid Request!', success : false});
    try{
        const product = await Product.findById(productId).lean();
        if (!product){
            return res.status(404).send({error : "Product does not exist!", success : false});
        }
        else{
            let isFav = false;
            var id = productId;
            let fav = await Favourite.findOne({user : user._id}, 'products');
            if (fav && fav.products.get(id)) isFav = true;

            let isCarted = false;
            let cart = await Cart.findOne({user : user._id}, 'products');
            if (cart && cart.products.get(id)) isCarted = true;

            product.isFav = isFav;
            product.isCarted = isCarted;
            return res.status(200).send({product : product});
        } 
    }
    catch (err) {
        console.log(err)
        next(err);
    }
}
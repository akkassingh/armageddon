const Product = require('../models/Product');
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
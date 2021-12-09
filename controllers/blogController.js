const Blog = require('../models/Blog');
const User = require("../models/User");
const Animal = require("../models/Animal");


module.exports.createBlog = async (req, res, next) => {
    if(req.headers.type=="User")
    user = res.locals.user;
    else
    user = res.locals.animal;
    try{
        const {
            date,
            thumbnail,
            images,
            text,
            title,
        } = req.body;
        const authorType = req.headers.type;
        const author = user._id;
        const peopleLiked = [];
        const newBlog = new Blog({date, thumbnail, images, authorType, author, text, title, peopleLiked});
        await newBlog.save();
        return res.status(201).send({success: true});
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports.likeBlog = async (req, res, next) => {
    if(req.headers.type=="User")
        user = res.locals.user;
    else
        user = res.locals.animal;
    const {blogId} = req.body;
    const blogDocument = await Blog.findById(blogId, 'peopleLiked').lean();
    if (!blogDocument){
        return res.status(404).send({"error" : "Invalid Request!"})
    }
    for (int i=0;i<blogDocument.length;i++){
        if (user._id == )
    }

}
const Blog = require('../models/Blog');
const User = require("../models/User");
const Animal = require("../models/Animal");

// ---------------------------------------- BLOGS ---------------------------------------------
module.exports.createBlog = async (req, res, next) => {
    let user = null
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
        const newBlog = new Blog({...req.body, author, authorType, peopleLiked});
        await newBlog.save();
        return res.status(201).send({success: true});
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports.likeBlog = async (req, res, next) => {
    let user = null
    if(req.headers.type=="User")
        user = res.locals.user;
    else
        user = res.locals.animal;
    const {blogId} = req.body;
    try {
        const blogDocument = await Blog.findById(blogId, 'peopleLiked likes').lean();
        if (!blogDocument){
            return res.status(404).send({"error" : "Invalid Request!"})
        }
        console.log(blogDocument)
        const isLiked = blogDocument.peopleLiked.some((e) => {
            return e.person.toString() == user._id.toString()
        })
        console.log(isLiked)
        if (isLiked){
            const newLikes = blogDocument.peopleLiked.filter(function (ele) {
                return ele.person.toString() != user._id.toString()
            })
            console.log(newLikes.length)
            await Blog.updateOne({ _id: blogId},{peopleLiked : newLikes, likes : blogDocument.likes - 1});
            return res.status(200).send({"message" : "Disliked the Blog", "success" : true})
        }
        else {
            const obj = {
                person : user._id,
                personType : req.headers.type
            }
            blogDocument.peopleLiked.push(obj)
            await Blog.updateOne({ _id: blogId},{peopleLiked : blogDocument.peopleLiked, likes: blogDocument.likes + 1 });
            return res.status(201).send({"message" : "Liked the Blog", "success" : true})
        }
    }
    catch (err) {
        console.log(err)
        next(err)
    }
}

module.exports.deleteBlog = async (req, res, next) => {
    let user = null;
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {blogId} = req.body;
    const blogDocument = await Blog.findById(blogId, 'author authorType');
    if (!blogDocument){
        return res.status(404).send({"message" : "No such Blog was found!", "success" : false});
    }
    else{
        if (req.headers.type==blogDocument.authorType && user._id.toString() == blogDocument.author.toString()){
            await Blog.deleteOne({ _id: blogId});
            return res.status(200).send({"message" : "Blog was deleted successfully", "success" : true})
        }
        else{
            return res.status(401).send({"message" : "You don't have access to this option", "success" : false})
        }
    }
}

module.exports.getBlogs = async (req, res, next) => {
    let user = null
    if (req.headers.type=="User")
        user = res.locals.user
    else
        user = res.locals.animal
    const {counter} = req.body;
    try{
        const blogs = await Blog.find({}).populate('peopleLiked.person', 'username avatar email phoneNumber').limit(10).skip(10*counter).lean();
        console.log(blogs)
        return res.send(blogs)
    }
    catch (err){
        console.log(err)
        next(err)
    }
    
}
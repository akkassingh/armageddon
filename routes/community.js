const express = require('express');
const communityRouter = express.Router();

const {
    createBlog,
    likeBlog,
    deleteBlog,
    getBlogs
} = require("../controllers/communityController")

const { requireAuth} = require('../controllers/authController');

// ---------------------------------------- BLOGS ---------------------------------------------
communityRouter.post('/createBlog', requireAuth, createBlog);
communityRouter.post('/likeBlog', requireAuth, likeBlog);
communityRouter.delete('/deleteBlog', requireAuth, deleteBlog);
communityRouter.post('/getBlogs',requireAuth, getBlogs);




module.exports = communityRouter;
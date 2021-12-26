const express = require('express');
const communityRouter = express.Router();

const {
    createBlog,
    likeBlog,
    deleteBlog,
    getBlogs,
    createGroup,
    changeDescription,
    updateHashtags,
    invitePeople,
    showPendingInvitations,
    getJoinedGroups,
    joinGroup,
    makeAdmin,
    deleteGroup,
    getAllGroups,
    retrieveGroupFeed,
    createGroupPost,
} = require("../controllers/communityController")

const { requireAuth} = require('../controllers/authController');

// ---------------------------------------- BLOGS ---------------------------------------------
communityRouter.post('/createBlog', requireAuth, createBlog);
communityRouter.post('/likeBlog', requireAuth, likeBlog);
communityRouter.delete('/deleteBlog', requireAuth, deleteBlog);
communityRouter.post('/getBlogs',requireAuth, getBlogs);

// ---------------------------------------- GROUPS ---------------------------------------------
communityRouter.post('/createGroup', requireAuth, createGroup); //ok
communityRouter.post('/changeDescription', requireAuth, changeDescription); //ok
communityRouter.post('/updateHashtags', requireAuth, updateHashtags); //ok
communityRouter.post('/invitePeople', requireAuth, invitePeople); //ok
communityRouter.post('/showPendingInvitations', requireAuth, showPendingInvitations); 
communityRouter.post('/getJoinedGroups', requireAuth, getJoinedGroups); //ok
communityRouter.post('/joinGroup', requireAuth, joinGroup); //ok
communityRouter.post('/makeAdmin', requireAuth, makeAdmin); //not handling animal case, type should also be taken
communityRouter.post('/deleteGroup', requireAuth, deleteGroup);
communityRouter.post('/getAllGroups', requireAuth, getAllGroups); //ok
communityRouter.post('/retrieveGroupFeed', requireAuth, retrieveGroupFeed);
communityRouter.post('/createGroupPost', requireAuth, createGroupPost);


module.exports = communityRouter;
const express = require('express');
const hamburgerRouter = express.Router();

const { requireAuth } = require('../controllers/authController');
const {
    getBookmarks,
    getBookings,
    submitFeedback
} = require('../controllers/hamburgerController');


hamburgerRouter.get('/getBookmarks/:offset',requireAuth,getBookmarks);
hamburgerRouter.post('/submitFeedback',requireAuth, submitFeedback)
module.exports = hamburgerRouter;
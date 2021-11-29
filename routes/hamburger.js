const express = require('express');
const hamburgerRouter = express.Router();

const { requireAuth } = require('../controllers/authController');
const {
    getBookmarks,
    getBookings,
    submitFeedback,
    getHelp
} = require('../controllers/hamburgerController');


hamburgerRouter.get('/getBookmarks',requireAuth,getBookmarks);
hamburgerRouter.post('/submitFeedback',requireAuth, submitFeedback);
hamburgerRouter.get('/getBookings',requireAuth,getBookings);
hamburgerRouter.post('/getHelp',requireAuth,getHelp)

module.exports = hamburgerRouter;
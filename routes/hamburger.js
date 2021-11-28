const express = require('express');
const hamburgerRouter = express.Router();

const { requireAuth } = require('../controllers/authController');
const {
    getBookmarks,
    getBookings,
} = require('../controllers/hamburgerController');


hamburgerRouter.get('/getBookmarks/:offset',requireAuth,getBookmarks);

module.exports = hamburgerRouter;
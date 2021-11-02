const express = require('express');
const authRouter = require('./auth');
const userRouter = require('./user');
const animalRouter = require('./animal');
const postRouter = require('./post');
const commentRouter = require('./comment');
const notificationRouter = require('./notification');
const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);
apiRouter.use('/post', postRouter);
apiRouter.use('/comment', commentRouter);
apiRouter.use('/notification', notificationRouter);
apiRouter.use('/animal', animalRouter);
module.exports = apiRouter;

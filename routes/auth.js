const express = require('express');
const authRouter = express.Router();

const {
  loginAuthentication,
  register,
  requireAuth,
  changePassword,
  githubLoginAuthentication,
  facebookLoginAuthentication,
  facebookRedirect,
  googleLoginAuthentication,
  googleRedirect
} = require('../controllers/authController');

authRouter.post('/login/github', githubLoginAuthentication);
authRouter.post('/login/facebook', facebookLoginAuthentication);// route needs to be updated to authenticate facebook, as logging in is handled by facebook, we will be validating him here.
authRouter.post('/login/google', googleLoginAuthentication);
authRouter.get('/authenticate/facebook/', facebookRedirect);
authRouter.get('/authenticate/google/', googleRedirect);

authRouter.post('/login', loginAuthentication);
authRouter.post('/register', register);

authRouter.put('/password', requireAuth, changePassword);

module.exports = authRouter;

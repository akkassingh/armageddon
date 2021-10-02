const express = require('express');
const authRouter = express.Router();

const {
  loginAuthentication,
  register,
  requireAuth,
  changePassword,
  githubLoginAuthentication,
  facebookLoginAuthentication,
  facebookRedirect
} = require('../controllers/authController');

authRouter.post('/login/github', githubLoginAuthentication);
authRouter.post('/login/facebook', facebookLoginAuthentication);
// authRouter.post('/login/google', googleLoginAuthentication);
authRouter.get('/authenticate/facebook/', facebookRedirect);
// authRouter.get('/authenticate/google/', googleRedirect);

authRouter.post('/login', loginAuthentication);
authRouter.post('/register', register);

authRouter.put('/password', requireAuth, changePassword);

module.exports = authRouter;

const express = require('express');
const authRouter = express.Router();

const {
  loginAuthentication,
  register,
  requireAuth,
  changePassword,
  updatePassword,
  githubLoginAuthentication,
  facebookLoginAuthentication,
  facebookRedirect,
  googleLoginAuthentication,
  googleRedirect,
  resetPassword
} = require('../controllers/authController');
const { sendPasswordResetLink } = require('../utils/controllerUtils');

authRouter.post('/login/github', githubLoginAuthentication);
authRouter.post('/login/facebook', facebookLoginAuthentication);// route needs to be updated to authenticate facebook, as logging in is handled by facebook, we will be validating him here.
authRouter.post('/login/google', googleLoginAuthentication);
authRouter.get('/authenticate/facebook/', facebookRedirect);
authRouter.get('/authenticate/google/', googleRedirect);

authRouter.post('/login', loginAuthentication);
authRouter.post('/register', register);

authRouter.put('/password', requireAuth, changePassword);
authRouter.get('/reset-password-mail', resetPassword);
authRouter.patch('/reset-password-form/:id', updatePassword);

module.exports = authRouter;
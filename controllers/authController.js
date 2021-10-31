const jwt = require('jwt-simple');
const crypto = require('crypto');
const User = require('../models/User');
const ConfirmationToken = require('../models/ConfirmationToken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const logger = require('../logger/logger');

const {
  sendConfirmationEmail,
  generateUniqueUsername,
  sendEmail,
  sendPasswordResetOTP,
  sendOTPEmail,
  hashPassword
} = require('../utils/controllerUtils');
const {
  validateEmail,
  validatePassword,
} = require('../utils/validation');


module.exports.verifyJwt = (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const id = jwt.decode(token, process.env.JWT_SECRET).id;
      const user = await User.findOne(
        { _id: id },
        'email username avatar bookmarks bio fullName confirmed website'
      );
      if (user) {
        return resolve(user);
      } else {
        reject('Not authorized.');
      }
    } catch (err) {
      return reject('Not authorized.');
    }
  });
};

module.exports.requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).send({ error: 'Not authorized.' });
  try {
    const user = await this.verifyJwt(authorization);
    // Allow other middlewares to access the authenticated user details.
    res.locals.user = user;
    return next();
  } catch (err) {
    return res.status(401).send({ error: err });
  }
};

module.exports.optionalAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    try {
      const user = await this.verifyJwt(authorization);
      // Allow other middlewares to access the authenticated user details.
      res.locals.user = user;
    } catch (err) {
      return res.status(401).send({ error: err });
    }
  }
  return next();
};

module.exports.loginAuthentication = async (req, res, next) => {
  const { authorization } = req.headers;
  const { usernameOrEmail, password } = req.body;
  if (authorization) {
    try {
      const user = await this.verifyJwt(authorization);
      let isNewUser = true;
      if (user.avatar) {
        isNewUser = false;
      }
      if (!user.confirmed){
        const otp = Math.floor(Math.random() * (999999 - 100000) ) + 100000;
        const hashotp = await hashPassword(otp.toString(),10);
        await sendOTPEmail(user.username, user.email, otp);
        const confirmationToken = await ConfirmationToken.findOne({user: user._id});
        if (confirmationToken){
          await ConfirmationToken.findOneAndUpdate({user: user._id},{
            token: hashotp,
            timestamp: Date.now(),
          })
        }
        else{
          await ConfirmationToken.create({user: user._id,token: hashotp,
            timestamp: Date.now()});
        }
        return res.send({
          user: {
            "email" : user.email,
            "username" : user.username,
            "confirmed": user.confirmed,
          },
          isNewUser,
          message: 'OTP has been sent successfully!',
          token: authorization,
        });
      }
      return res.send({
        user: {
          "email" : user.email,
          "username" : user.username,
          "confirmed": user.confirmed,
        },
        isNewUser,
        token: authorization,
      });
    } catch (err) {
      return res.status(401).send({ error: err });
    }
  }

  if (!usernameOrEmail || !password) {
    return res
      .status(400)
      .send({ error: 'Please provide both a username/email and a password.' });
  }

  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!user || !user.password) {
      return res.status(401).send({
        error: 'The credentials you provided are incorrect, please try again.',
      });
    }
    const comparepwd = await bcrypt.compare(password, user.password);
    if (!comparepwd){
      return res.status(401).send({
        error:
          'The credentials you provided are incorrect, please try again.',
      });
    }
    let isNewUser = true;
      if (user.avatar) {
        isNewUser = false;
      }
      if (!user.confirmed){
        const otp = Math.floor(Math.random() * (999999 - 100000) ) + 100000;
        const hashotp = await hashPassword(otp.toString(),10);
        await sendOTPEmail(user.username, user.email, otp);
        const confirmationToken = await ConfirmationToken.findOne({user: user._id});
        if (confirmationToken){
          await ConfirmationToken.findOneAndUpdate({user: user._id},{
            token: hashotp,
            timestamp: Date.now(),
          })
        }
        else{
          await ConfirmationToken.create({user: user._id,token: hashotp,
            timestamp: Date.now()});
        }
      }
      
      return res.send({
        user: {
          "email" : user.email,
          "username" : user.username,
          "confirmed": user.confirmed,
        },
        isNewUser,
        token: jwt.encode({ id: user._id }, process.env.JWT_SECRET),
      });
  } catch (err) {
    next(err);
  }
};

module.exports.register = async (req, res, next) => {
  logger.info("*** Register method called ***");
  const { email, password } = req.body;
  let user = null;
  let confirmationToken = null;

  const emailError = validateEmail(email);
  if (emailError) return res.status(400).send({ error: emailError });

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).send({ error: passwordError });

  try {
    let username = email.split('@')[0];
    username = await generateUniqueUsername(username);
    logger.info('Unique username is', username);
    const otp = Math.floor(Math.random() * (999999 - 100000) ) + 100000;
    const hashedotp = await hashPassword(otp.toString(),10);
    user = new User({ email, password, username });
    confirmationToken = new ConfirmationToken({
      user: user._id,
      // token: crypto.randomBytes(20).toString('hex'),
      token: hashedotp,
      timestamp: Date.now(),
    });
    await user.save();
    await confirmationToken.save();
    res.status(201).send({
      user: {
        email: user.email,
        username: user.username,
        confirmed: false,
      },
      isNewUser: true,
      message: 'OTP has been sent successfully!',
      token: jwt.encode({ id: user._id }, process.env.JWT_SECRET),
    });
    // sendConfirmationEmail(user.username, user.email, confirmationToken.token);
    await sendOTPEmail(username, email, otp);
  } catch (err) {
    logger.info("error while register new user: ", err);
    next(err);
  }
  // sendConfirmationEmail(user.username, user.email, confirmationToken.token);
};

module.exports.githubLoginAuthentication = async (req, res, next) => {
  const { code, state } = req.body;
  if (!code || !state) {
    return res
      .status(400)
      .send({ error: 'Please provide a github access code and state.' });
  }

  try {
    // Exchange the temporary code with an access token
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      }
    );
    const accessToken = response.data.split('&')[0].split('=')[1];

    // Retrieve the user's info
    const githubUser = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });

    // Retrieve the user's email addresses
    // Private emails are not provided in the previous request
    const emails = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `token ${accessToken}` },
    });
    const primaryEmail = emails.data.find((email) => email.primary).email;

    const userDocument = await User.findOne({ githubId: githubUser.data.id });
    if (userDocument) {
      return res.send({
        user: {
          _id: userDocument._id,
          email: userDocument.email,
          username: userDocument.username,
          avatar: userDocument.avatar,
          bookmarks: userDocument.bookmarks,
          isNewUser: false,
        },
        token: jwt.encode({ id: userDocument._id }, process.env.JWT_SECRET),
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: primaryEmail }, { username: githubUser.data.login }],
    });

    if (existingUser) {
      if (existingUser.email === primaryEmail) {
        return res.status(400).send({
          error:
            'A user with the same email already exists, please change your primary github email.',
        });
      }
      if (existingUser.username === githubUser.data.login.toLowerCase()) {
        const username = await generateUniqueUsername(githubUser.data.login);
        githubUser.data.login = username;
      }
    }

    const user = new User({
      email: primaryEmail,
      fullName: githubUser.data.name,
      username: githubUser.data.login,
      githubId: githubUser.data.id,
      avatar: githubUser.data.avatar_url,
    });

    await user.save();
    return res.send({
      user: {
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bookmarks: user.bookmarks,
        isNewUSer: true,
      },
      token: jwt.encode({ id: user._id }, process.env.JWT_SECRET),
    });
  } catch (err) {
    next(err);
  }
};

module.exports.facebookRedirect = async (req, res, next) => {
  return res.status(200).send('success');
};

module.exports.googleRedirect = async (req, res, next) => {
  return res.status(200).send('success');
};

module.exports.facebookLoginAuthentication = async (req, res, next) => {
  const { code, state } = req.body;
  if (!code || !state) {
    return res
      .status(400)
      .send({error: 'Please provide valid credentials'});
  }
  try{
    const { data } = await axios({
      url: 'https://graph.facebook.com/v4.0/oauth/access_token',
      method: 'get',
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: `${process.env.HOME_URL}/api/auth/authenticate/facebook/`,
        grant_type: 'authorization_code',
        code,
        state
      },
    });
    const accessToken = data.access_token;
    console.log(accessToken)
    logger.info("accessToken is ",JSON.stringify(accessToken));
    logger.info("*******************************************");

    // Retrieve the user's info
    //{ locale: 'en_US', fields: 'name, email' }
    const fbUser = await axios.get('https://graph.facebook.com/v2.5/me?fields=id,name,email,first_name,last_name', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('fbUser is as below');
    console.log(fbUser.data);
    logger.info("fbUser is ", JSON.stringify(fbUser.data))
    const primaryEmail = fbUser.data.email;
    const facebookId = fbUser.data.id;
    const userDocument = await User.findOne({ facebookId });
    logger.info('userDocument is ', JSON.stringify(userDocument));
    let isNewUser = true;
    if (user.avatar) {
      isNewUser = false;
    }
    if (userDocument) {
      return res.send({
        user: {
          _id: userDocument._id,
          email: userDocument.email,
          username: userDocument.username,
          avatar: userDocument.avatar,
          bookmarks: userDocument.bookmarks,
        },
        isNewUser,
        token: jwt.encode({ id: userDocument._id }, process.env.JWT_SECRET),
      });
    }

    const existingUser = await User.findOne({email: primaryEmail});
    // const existingUser = await User.findOne({
    //   $or: [{ email: primaryEmail }, { username: fbUser.data.first_name+fbUser.data.last_name.toLowerCase() }],
    // });

    logger.info("existingUser is ", JSON.stringify(existingUser));

    if (existingUser) {
      let isNewUser = true;
      if (existingUser.avatar) {
        isNewUser = false;
      }
      logger.info("User Exists!!!!");
      if (existingUser.email === primaryEmail) {
        // return res.status(400).send({
        //   error:
        //     'A user with the same email already exists, please change your email.',
        // });
        return res.send(200).json({
          user: {
            email: primaryEmail,
            username: existingUser.username,
          },
          isNewUser,
          token: jwt.encode({ id: existingUser._id }, process.env.JWT_SECRET),
        })
      }
      // if (existingUser.username === fbUser.data.first_name+fbUser.data.last_name.toLowerCase()) {
      //   const username = await generateUniqueUsername(fbUser.data.first_name+fbUser.data.last_name.toLowerCase());
      //   fbUser.data.login = username;
      // }
    }
    logger.info("fbUser is ", JSON.stringify(fbUser.data));
    const user = new User({
      email: primaryEmail,
      fullName: fbUser.data.name,
      // username: fbUser.data.login ? fbUser.data.login : fbUser.data.first_name+fbUser.data.last_name.toLowerCase(),
      username: await generateUniqueUsername(fbUser.data.first_name+fbUser.data.last_name.toLowerCase()),
      confirmed: true,
      facebookId: fbUser.data.id,
    });

    await user.save();
    return res.send({
      user: {
        email: user.email,
        username: user.username,
        bookmarks: user.bookmarks,
      },
      isNewUser: true,
      token: jwt.encode({ id: user._id }, process.env.JWT_SECRET),
    });
  } catch (err) {
    console.log(err)
    logger.err("err is ", err);
    next(err);
  }
};

module.exports.googleLoginAuthentication = async (req, res, next) => {
  const { code } = req.body;
  if (!code ) {
    return res
      .status(400)
      .send({ error: 'Please provide valid code and state.' });
  }
  try{
    const { data } = await axios({
      url: 'https://oauth2.googleapis.com/token',
      method: 'post',
      params: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `http://localhost:9000/api/auth/authenticate/google`,
        grant_type: 'authorization_code',
        code
      },
    });
    const accessToken = data.access_token;

    console.log("accessToken is ", accessToken);
    
    // Retrieve the user's info
    const googleUserResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    logger.info("googleUser is ", JSON.stringify(googleUserResponse.data))
    googleUser = googleUserResponse.data;
    const primaryEmail = googleUser.email;
    const googleUserId = googleUser.id;
    const userDocument = await User.findOne({ googleUserId });
    logger.info('userDocument is ', JSON.stringify(userDocument));
    if (userDocument) {
      let isNewUser = true;
      if (userDocument.avatar) {isNewUser = false;}
      return res.send({
        user: {
          _id: userDocument._id,
          email: userDocument.email,
          username: userDocument.username,
          avatar: userDocument.avatar,
          bookmarks: userDocument.bookmarks,
        },
        isNewUser,
        token: jwt.encode({ id: userDocument._id }, process.env.JWT_SECRET),
      });
    }

    const existingUser = await User.findOne({email:primaryEmail});

    // const existingUser = await User.findOne({
    //   $or: [{ email: primaryEmail }, { username: googleUser.given_name+googleUser.family_name.toLowerCase() }],
    // });

    logger.info("existingUser is ", JSON.stringify(existingUser));

    if (existingUser) {
      logger.info("User Exists!!!!");
      if (existingUser.email === primaryEmail) {
        // return res.status(400).send({
        //   error:
        //     'A user with the same email already exists, please change your email.',
        // });
        let isNewUser = true;
        if (existingUser.avatar) {isNewUser = false;}
        return res.send(200).json({
          user: {
            email: primaryEmail,
            username: existingUser.username,
          },
          isNewUser,
          token: jwt.encode({ id: existingUser._id }, process.env.JWT_SECRET),
        })
      }
      // if (existingUser.username === googleUser.given_name+googleUser.family_name.toLowerCase()) {
      //   const username = await generateUniqueUsername(googleUser.given_name+googleUser.family_name.toLowerCase());
      //   fbUser.data.login = username;
      // }
    }
    logger.info("googleUser is ", JSON.stringify(googleUser.data));
    const user = new User({
      email: primaryEmail,
      fullName: googleUser.name,
      // username: googleUser.login ? googleUser.login : await generateUniqueUsername(googleUser.given_name+googleUser.family_name.toLowerCase());,
      username: await generateUniqueUsername(googleUser.given_name+googleUser.family_name.toLowerCase()),
      googleUserId: googleUserId,
      confirmed: true,
    });

    await user.save();
    return res.send({
      user: {
        email: user.email,
        username: user.username,
        bookmarks: user.bookmarks,
      },
      isNewUser: true,
      token: jwt.encode({ id: user._id }, process.env.JWT_SECRET),
    });
  }catch (err) {
    console.log(err)
    return res
    .status(400)
    .send({ err });
  }
};

module.exports.changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = res.locals.user;
  let currentPassword = undefined;

  try {
    const userDocument = await User.findById(user._id);
    currentPassword = userDocument.password;

    const result = await bcrypt.compare(oldPassword, currentPassword);
    if (!result) {
      return res.status('401').send({
        error: 'Your old password was entered incorrectly, please try again.',
      });
    }

    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError)
      return res.status(400).send({ error: newPasswordError });

    userDocument.password = newPassword;
    await userDocument.save();
    return res.send({message: "Password has been changed successfully!"});
  } catch (err) {
    return next(err);
  }
};

module.exports.resetPasswordOTP = async (req, res, next) => {
  try{
    logger.info("***Reset Password called***")
    const {email} = req.body;
    if (email){
      const user = await User.findOne({email});
      if (!user) return res.status(404).send({error: "No user with given username exist"});
      const token = jwt.encode({ id: user._id }, process.env.JWT_SECRET);
      const otp = Math.floor(Math.random() * (999999 - 100000) ) + 100000;
      // const token = await ConfirmationToken.findOne({user: user._id});
      const current_time = Date.now();
      await sendPasswordResetOTP(email,current_time,otp.toString());
      res.status(201).json({'message':`Password Reset OTP Sent to Email ID of user ${user._id}`, 'result':'success', 'token':token})
    }
  }
  catch (err){
    logger.info(err)
    res.status(500).send({err});
    console.log(error);
  }
}

module.exports.verifyResetPasswordOTP = async (req, res, next) => {
  const {otp} = req.body;
  const user = res.locals.user;

  try {
    const confirmationToken = await ConfirmationToken.findOne({user: user._id});
    console.log(confirmationToken);
    if (!confirmationToken || Date.now() > confirmationToken.timestamp + 900000) {
      return res
        .status(404)
        .send({ error: 'Invalid or expired confirmation attempt' });
    }
    const token = confirmationToken.resettoken;
    const compareotp = await bcrypt.compare(otp,token);
    if (!compareotp){
      return res.status(401).send({
        error:
        'The credentials you provided are incorrect, please try again.',
        });
    }
      await ConfirmationToken.deleteOne({ resettoken: token, user: user._id });
      return res.status(200).send({message:'verification successful'});    
  } 
  catch (err) {
    next(err);
  }
};

module.exports.updatePassword = async(req,res,next) => {
  logger.info("***Update Password called***")
  const user = res.locals.user;
  const {newPassword,otp} = req.body;
  const hashednewPassword = await hashPassword(newPassword.toString(),10)
  try{
    if (user.passwordRestTime + 900000 < Date.now()) return res.status(404).json({error: 'OTP has been expired. Please try again!'});
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError)
      return res.status(400).send({ error: newPasswordError });
      
      await User.updateOne({_id: user._id}, {password: hashednewPassword});
      sendEmail(user.email,'Password Changed', 'Your password was changed successfully!')
      res.status(201).json({'message':'Your password was reset successfully!','result':'success'})
  }
  catch (err){
    logger.info(err)
    res.status(500).send({err});
    console.log(err)
  }
}

module.exports.resendOTP = async (req, res, next) => {
  const {path} = req.params; 
  // 2 cases as of now, login/register will be one and forget pwd will be another one
  // for login/register we will pass 'login' in params and for forget pwd, we will pass 'forgetpwd' in params
  const user = res.locals.user;
  const otp = Math.floor(Math.random() * (999999 - 100000) ) + 100000;
  const hashotp = await hashPassword(otp.toString(),10);
  try {
    if (path === 'login') {
      // register and login can be handeled together
      const confirmationToken = await ConfirmationToken.findOne({user: user._id});
      if (confirmationToken){
        await ConfirmationToken.findOneAndUpdate({user: user._id},{
          token: hashotp,
          timestamp: Date.now(),
        });
      }
      else{
        await ConfirmationToken.create({
          user: user._id,
          token: hashotp,
          timestamp: Date.now(),
        });
      }
      await sendOTPEmail(user.username,user.email,otp);
      res.status(201).send({message: 'OTP has been sent again!'})
    }
    else if (path === 'forgetpwd'){
      await sendPasswordResetOTP(user.email, Date.now(), otp);
      res.status(201).send({message: 'OTP has been sent again!'})
    }
  }
  catch (err) {
    console.log(err)
    logger.err("err is ", err);
    next(err);
  }
}
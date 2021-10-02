# Armageddon

> Backend Serivce for Tamely

## Tech

- Websocket management: <a href="https://github.com/socketio/socket.io">`Socket.io`</a>
- Backend: <a href="https://github.com/expressjs/express">`Express`</a>
- Database: <a href="https://github.com/Automattic/mongoose">`MongoDB`</a>
- Image hosting: <a href="https://cloudinary.com/">`Cloudinary`</a>

---

## Installation - Development

### Setup

> Install npm dependencies

```shell
$ npm install
```

> Set up a MongoDB database either locally or provision a free database with <a href='https://www.mongodb.com/cloud/atlas'>`MongoDB Atlas`</a>

> Create a free <a href="https://cloudinary.com/">`Cloudinary account`</a>

> Create a <a href='https://github.com/settings/developers'>`GitHub OAuth app`</a>

> Create a .env file in the root directory

> Set up required environment variables

```javascript
MONGO_URI= // mongodb://localhost:27017/tamely
JWT_SECRET= // random string: j2390jf09kjsalkj4r93
CLOUDINARY_API_KEY= // Cloudinary API key
CLOUDINARY_API_SECRET= // Cloudinary API secret
CLOUDINARY_CLOUD_NAME= // Cloudinary cloud name
SMTP_HOST= // mail.example.com
SMTP_PORT= // 587
EMAIL_USERNAME= // example@example.com
EMAIL_PASSWORD= // Password
HOME_URL= // http://localhost:3000
GITHUB_CLIENT_ID= // Client id for GitHub OAuth app
GITHUB_CLIENT_SECRET= // Client secret for GitHub OAuth app
GOOGLE_CLIENT_ID= // Google client id
GOOGLE_CLIENT_SECRET= // Google Client Secret
FACEBOOK_CLIENT_ID= //Facebook Client id
FACEBOOK_CLIENT_SECRET= // Facebook Client Secret
MODERATECONTENT_API_KEY= // Free API key from https://moderatecontent.com
```

> Go to root and start server

```shell
$ npm run dev
```

The app should launch automatically, enjoy playing around 😄

---

## Support

Reach out to me at one of the following places!

- Email at <a href="mailto:akkassingh@gmail.com">`akkassingh@gmail.com`</a>

website: http://akkassingh.me/

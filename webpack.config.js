const path = require('path');
const webpack = require('webpack');

const environment = process.env.ENVIRONMENT;

console.log('environment:::::', environment);

let ENVIRONMENT_VARIABLES = {
  ENVIRONMENT: JSON.stringify('development'),
  PORT: JSON.stringify('9090'),
  GREETING_MESSAGE: JSON.stringify('API Running In Development Environment'),
  API_WORKS_MESSAGE: JSON.stringify('Development API Works!!!'),
  MONGO_URI: JSON.stringify('mongodb+srv://root:root$1234@cluster0.gr1vl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'),
  JWT_SECRET: JSON.stringify('simar'),
  CLOUDINARY_API_KEY: JSON.stringify('569545899255388'),
  CLOUDINARY_API_SECRET: JSON.stringify('OG_Yic7LUCGWlgv2MO8WL62RQ3M'),
  CLOUDINARY_CLOUD_NAME: JSON.stringify('tamely'),
  // SMTP_HOST: JSON.stringify('mail.example.com')
  // SMTP_PORT: JSON.stringify('587'),
  EMAIL_USERNAME: JSON.stringify('technology@tamely.in'),
  EMAIL_PASSWORD: JSON.stringify('Simar@123'),
  HOME_URL: JSON.stringify('https://localhost:9000'),
  GITHUB_CLIENT_ID: JSON.stringify('0d3f7f8ae8e9167dc3c3'),
  GITHUB_CLIENT_SECRET: JSON.stringify('6395fba4fcfcaf65d91a7317a16639691fad656b'),
  MODERATECONTENT_API_KEY: JSON.stringify('a35014f624935a33473b693100338b16'),
  GOOGLE_CLIENT_ID: JSON.stringify('1044027133560-8a1bh9tp5ngdptg67hamnis3banr0ig6.apps.googleusercontent.com'),
  GOOGLE_CLIENT_SECRET: JSON.stringify('dnK2HiQbuWasWxuqzJ1JT81f'),
  FACEBOOK_CLIENT_ID: JSON.stringify('263237822324560'),
  FACEBOOK_CLIENT_SECRET: JSON.stringify('3bc50074213a00118f4e81a8f812a161')
};

if (environment === 'testing') {
  ENVIRONMENT_VARIABLES = {
    ENVIRONMENT: JSON.stringify('testing'),
    PORT: JSON.stringify('9090'),
    GREETING_MESSAGE: JSON.stringify('API Running In Development Environment'),
    API_WORKS_MESSAGE: JSON.stringify('Development API Works!!!'),
    MONGO_URI: JSON.stringify('mongodb+srv://root:root$1234@cluster0.gr1vl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'),
    JWT_SECRET: JSON.stringify('simar'),
    CLOUDINARY_API_KEY: JSON.stringify('569545899255388'),
    CLOUDINARY_API_SECRET: JSON.stringify('OG_Yic7LUCGWlgv2MO8WL62RQ3M'),
    CLOUDINARY_CLOUD_NAME: JSON.stringify('tamely'),
    // SMTP_HOST: JSON.stringify('mail.example.com')
    // SMTP_PORT: JSON.stringify('587'),
    EMAIL_USERNAME: JSON.stringify('technology@tamely.in'),
    EMAIL_PASSWORD: JSON.stringify('Simar@123'),
    HOME_URL: JSON.stringify('https://localhost:9000'),
    GITHUB_CLIENT_ID: JSON.stringify('0d3f7f8ae8e9167dc3c3'),
    GITHUB_CLIENT_SECRET: JSON.stringify('6395fba4fcfcaf65d91a7317a16639691fad656b'),
    MODERATECONTENT_API_KEY: JSON.stringify('a35014f624935a33473b693100338b16'),
    GOOGLE_CLIENT_ID: JSON.stringify('1044027133560-8a1bh9tp5ngdptg67hamnis3banr0ig6.apps.googleusercontent.com'),
    GOOGLE_CLIENT_SECRET: JSON.stringify('dnK2HiQbuWasWxuqzJ1JT81f'),
    FACEBOOK_CLIENT_ID: JSON.stringify('263237822324560'),
    FACEBOOK_CLIENT_SECRET: JSON.stringify('3bc50074213a00118f4e81a8f812a161')
  };
} else if (environment === 'production') {
  ENVIRONMENT_VARIABLES = {
    ENVIRONMENT: JSON.stringify('production'),
    PORT: JSON.stringify('9090'),
    GREETING_MESSAGE: JSON.stringify('API Running In Development Environment'),
    API_WORKS_MESSAGE: JSON.stringify('Development API Works!!!'),
    MONGO_URI: JSON.stringify('mongodb+srv://root:root$1234@cluster0.gr1vl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'),
    JWT_SECRET: JSON.stringify('simar'),
    CLOUDINARY_API_KEY: JSON.stringify('569545899255388'),
    CLOUDINARY_API_SECRET: JSON.stringify('OG_Yic7LUCGWlgv2MO8WL62RQ3M'),
    CLOUDINARY_CLOUD_NAME: JSON.stringify('tamely'),
    // SMTP_HOST: JSON.stringify('mail.example.com')
    // SMTP_PORT: JSON.stringify('587'),
    EMAIL_USERNAME: JSON.stringify('technology@tamely.in'),
    EMAIL_PASSWORD: JSON.stringify('Simar@123'),
    HOME_URL: JSON.stringify('https://localhost:9000'),
    GITHUB_CLIENT_ID: JSON.stringify('0d3f7f8ae8e9167dc3c3'),
    GITHUB_CLIENT_SECRET: JSON.stringify('6395fba4fcfcaf65d91a7317a16639691fad656b'),
    MODERATECONTENT_API_KEY: JSON.stringify('a35014f624935a33473b693100338b16'),
    GOOGLE_CLIENT_ID: JSON.stringify('1044027133560-8a1bh9tp5ngdptg67hamnis3banr0ig6.apps.googleusercontent.com'),
    GOOGLE_CLIENT_SECRET: JSON.stringify('dnK2HiQbuWasWxuqzJ1JT81f'),
    FACEBOOK_CLIENT_ID: JSON.stringify('263237822324560'),
    FACEBOOK_CLIENT_SECRET: JSON.stringify('3bc50074213a00118f4e81a8f812a161')
  };
}

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'api.bundle.js',
  },
  target: 'node',
  plugins: [
    new webpack.DefinePlugin(ENVIRONMENT_VARIABLES),

  ],
};
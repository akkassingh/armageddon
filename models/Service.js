const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { prependOnceListener } = require("../logger/logger");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const BackGroundCheckSchema = new Schema({
  service: {
    type: Schema.ObjectId,
    ref: "Service",
  },
  adharFront: {
    type: String,
    required: true,
  },
  adharBack: {
    type: String,
    required: true,
  },
  pan: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    required: true,
  },
  bankStatement: {
    type: String,
    required: true,
  },
  email: String,
  phone: String,
  dob: String,
  references: [{ name: String, phone: String }],
});

const BackgroundCheck = mongoose.model(
  "BackGroundCheck",
  BackGroundCheckSchema
);

module.exports.BackgroundCheck = BackgroundCheck;

const ServiceSchema = new Schema({
  serviceProvider: {
    type: Schema.ObjectId,
    ref: "ServiceProvider",
  },
  serviceType: String,
  isBackgroundCheck: {
    type: Boolean,
    default: false,
    required: false,
  },
  backgroundCheck: {
    type: Schema.ObjectId,
    ref: "BackgroundCheck",
  },
  isDogWalkingPreferences: {
    type: Boolean,
    default: false,
    required: false,
  },
  isRates: {
    type: Boolean,
    default: false,
    required: false,
  },
  isServiceProfile: {
    type: Boolean,
    default: false,
    required: false,
  },
  isReviewsAndRatings: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const Service = mongoose.model("Service", ServiceSchema);
module.exports.Service = Service;

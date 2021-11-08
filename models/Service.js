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

const DogWalkingPreferencesSchema = new Schema({
  service: {
    type: Schema.ObjectId,
    ref: "Service",
  },
  availableDays: [{ day: String, available: Boolean }],
  weekDayTimings: [String],
  weekendTimings: [String],
  dogSizes: [String],
  serviceAreaRadius: String,
  covidVaccinated: Boolean,
  ableToRunWithDogs: Boolean,
  ableToAdministerMedicine: Boolean,
  ableToTakeCareOfSeniorDogs: Boolean,
  ableToTakeCareOfSpecialNeeds: Boolean,
  ableToManageHighEnergyDogs: Boolean,
  ableToWalkFaster: Boolean,
  ableToManageDogsWhoPull: Boolean,
  ableToTakeCareOfPuppies: Boolean,
  ableToTrainDogs: Boolean,
});

const DogWalkingPreferences = mongoose.model(
  "DogWalkingPreferences",
  DogWalkingPreferencesSchema
);

module.exports.DogWalkingPreferences = DogWalkingPreferences;



const ReviewsandRatingsSchema = new Schema({
  ServiceProvider: {
    type: Schema.ObjectId,
    ref: "ServiceProvider",
  },
  ReviewsandRating:[new Schema({   
    User: {
      type: Schema.ObjectId,
      ref: "User",
    },
    ServiceAppointment:{
      type: Schema.ObjectId,
      ref: "ServiceAppointment",
    },
    rating:{type: Number, required:false},
    review:{type: Number, required:false}
  },{ _id: false })]
});

const ReviewsandRatingsSchema = mongoose.model(
  "ReviewsandRatings",
  ReviewsandRatingsSchema
);

module.exports.ReviewsandRatings = ReviewsandRatings;




const ServiceProfileSchema = new Schema({
  service: {
    type: Schema.ObjectId,
    ref: "Service",
  },
  mainLine: String,
  description: String,
  address: {
    addressLine1: String,
    addressLine2: String,
    state: String,
    city: String,
    pinCode: String,
  },
  pictures: [String],
});

const ServiceProfile = mongoose.model("ServiceProfile", ServiceProfileSchema);

module.exports.ServiceProfile = ServiceProfile;

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
  dogWalkingPreferences: {
    type: Schema.ObjectId,
    ref: "DogWalkingPreferences",
  },
  isServiceProfile: {
    type: Boolean,
    default: false,
    required: false,
  },
  ServiceProfile: {
    type: Schema.ObjectId,
    ref: "ServiceProfile",
  },
  isRates: {
    type: Boolean,
    default: true,
    required: false,
  },
  isReviewsAndRatings: {
    type: Boolean,
    default: false,
    required: false,
  },
  ReviewsandRatings: {
    type: Schema.ObjectId,
    ref: "ReviewsandRatings",
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const Service = mongoose.model("Service", ServiceSchema);
module.exports.Service = Service;



const ServiceAppointment = new Schema({
  ServiceProvider: {
    type: Schema.ObjectId,
    ref: "ServiceProvider",
  },
  User: {
    type: Schema.ObjectId,
    ref: "User",
  },
  bookingDetails: {
    type: Schema.ObjectId,
    ref: "bookingDetails",
  },
  petDetails: {
    type: Schema.ObjectId,
    ref: "petDetails",
  },
  startTIme:Number,
  bookingStatus:{
    type: Boolean,
    default: false,
    required: false,
  }
  
});

const ServiceAppointment = mongoose.model("ServiceAppointment", ServiceAppointmentSchema);

module.exports.ServiceAppointment = ServiceAppointment;



const ServiceReport = new Schema({
  ServiceProvider: {
    type: Schema.ObjectId,
    ref: "ServiceProvider",
  },
  User: {
    type: Schema.ObjectId,
    ref: "User",
  },
  ServiceAppointment: {
    type: Schema.ObjectId,
    ref: "ServiceAppointment",
  },
  distance:Number,
  time:Number,
  pee:{
    type: Boolean,
    default: false,
    required: false,
  },
  poo:{
    type: Boolean,
    default: false,
    required: false,
  }
  
});

const ServiceReport = mongoose.model("ServiceReport", ServiceReportSchema);

module.exports.ServiceReport = ServiceReport;
//------------------------------
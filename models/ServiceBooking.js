const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { prependOnceListener } = require("../logger/logger");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const petDetailsSchema = new Schema({
  pets: [
    {
      type: Schema.ObjectId,
      ref: "Animal",
    },
  ],
});

const petDetails = mongoose.model("petDetails", petDetailsSchema);

module.exports.petDetails = petDetails;

const bookingDetailsSchema = new Schema({
  numberOfPets: Number,
  petDetails: [
    {
      pet: {
        type: Schema.ObjectId,
        ref: "petDetails",
      },
      size: String,
    },
  ],
  specialInstructions: String,
  petBehaviour: {
    pullsOnTheLeash: Boolean,
    likeInteractingWithOtherDogsOrPeople: Boolean,
    jumpsUpOnPeopleAndThings: Boolean,
    chaseSmallerAnimals: Boolean,
    protectiveOfHome: Boolean,
  },
  petRunningLocation: {
    addressLine1: String,
    addressLine2: String,
    state: String,
    city: String,
    pinCode: String,
  },
  phone: String,
  alternatePhone: [String],
  package: {
    description: String,
    amount: String,
    frequency: {
      type: Number,
      enum: [7, 30, 1],
    },
    dayfrequency:Number
  },
  run1:String,
  run2:String,
  startDate: String,
  dayOff: String,
  runDetails:[
   {
      runTime1:String,
      runTime2:String,
      runDate:String,
      run2Status:Number,
      run1Status:Number,
      runReport1: {
        type: Schema.ObjectId,
        ref: "ServiceAppointment",
      },
      runReport2: {
        type: Schema.ObjectId,
        ref: "ServiceAppointment",
      }
    }
  ],
  paymentDetails: {
    transactionId: String,
    Status: {
      type: String,
      default: "Pending",
      enum: ["Success", "Fail", "Pending"],
    },
  },
  bookingStatus: {
    type: String,
    default: "Dog Runner will be assigned shortly",
    enum: ["Dog Runner will be assigned shortly", "Completed"],
  },
});

const bookingDetails = mongoose.model("bookingDetails", bookingDetailsSchema);

module.exports.bookingDetails = bookingDetails;

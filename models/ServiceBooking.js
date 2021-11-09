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
  },
  startDate: String,
  dayOff: String,
  run1: String,
  run2: String,
  paymentDetails: {
    transactionId: String,
    Status: {
      type: String,
      enum: ["Success", "Fail"],
    },
  },
  bookingStatus: {
    type: String,
    enum: ["Dog Runner will be assigned shortly", "Completed"],
  },
});

const bookingDetails = mongoose.model("bookingDetails", bookingDetailsSchema);

module.exports.bookingDetails = bookingDetails;

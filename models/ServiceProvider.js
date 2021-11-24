const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { prependOnceListener } = require("../logger/logger");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const ServiceProviderSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: [true, "A user with this email already exists"],
    lowercase: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email address.");
      }
    },
  },
  phoneNumber: {
    type: String,
    required: false,
    // unique: [true, "A user with this email already exists"],
    length: 20,
  },
  username: {
    type: String,
    // required: true,
    lowercase: true,
    unique: [true, "A user with this email already exists"],
    minlength: 3,
  },
  password: {
    type: String,
    minlength: 8,
  },
  isCompany: {
    type: Boolean,
    default: false,
    required: false,
  },
  isIndividual: {
    type: Boolean,
    required: false,
  },
  companyName: {
    type: String,
    lowercase: false,
    default: "company",
    minlength: 3,
  },
  fullName: {
    type: String,
  },
  services: [String],

  animals: [String],

  rates: [Number],

  availability: [String],
  avatar: String,
  pottyBreaks: String,
  oneLiner: {
    type: String,
    maxlength: 80,
  },
  description: {
    type: String,
    maxlength: 200,
  },
  dateOfBirth: {
    type: String,
    maxlength: 10,
  },
  address: String,
  photos: [String],
  pan: String,
  aadhar: String,
  githubId: Number,
  faceBookUserId: String,
  googleUserId: String,
  private: {
    type: Boolean,
    default: false,
  },
  bio: {
    type: String,
    maxlength: 130,
  },                    //not needed
  website: {
    type: String,
    maxlength: 65,       //not needed
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
});

ServiceProviderSchema.pre("save", async function (next) {
  console.log(this);
  if (this.isNew) {
    try {
      const document = await ServiceProvider.findOne({
        $or: [{ email: this.email }, { username: this.userName }],
      });
      if (document) {
        console.log(document);
        return next(
          new RequestError(
            "A user with that email or username or phone number already exists.",
            400
          )
        );
      }
    } catch (err) {
      // console.log(err)
      return next((err.statusCode = 400));
    }
  }
});

const ServiceProvider = mongoose.model(
  "ServiceProvider",
  ServiceProviderSchema
);
module.exports = ServiceProvider;

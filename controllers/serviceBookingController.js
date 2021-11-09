const ServiceType = require("../models/ServiceType");
const { petDetails, bookingDetails } = require("../models/ServiceBooking");
const {
  Service,
  BackgroundCheck,
  DogWalkingPreferences,
  ReviewsandRatings,
  ServiceProfile,
} = require("../models/Service");

const { ServiceProvider } = require("../models/ServiceProvider");
const ObjectId = require("mongoose").Types.ObjectId;
const logger = require("../logger/logger");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const Razorpay = require("razorpay");

const razorPayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports.generateRazorPayOrderId = async (req, res, next) => {
  try {
    var options = {
      amount: Number(req.body.amount) * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: req.body.bookingId,
    };
    async function orderCreation() {
      return new Promise((resolve, reject) => {
        razorPayInstance.orders.create(options, function (err, order) {
          console.log(order);
          resolve(order);
        });
      });
    }
    let orderDetails = await orderCreation();
    return res.status(200).json(orderDetails);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.serviceProvidersList = async (req, res, next) => {
  try {
    let serviceList = await Service.find({});

    let finalData = [];

    for (let s1 of serviceList) {
      let resp = await Service.findById({ _id: s1._id })
        .populate({ path: "serviceProvider", model: ServiceProvider })
        .populate({ path: "backgroundCheck", model: BackgroundCheck })
        .populate({
          path: "dogWalkingPreferences",
          model: DogWalkingPreferences,
        })
        .populate({ path: "ServiceProfile", model: ServiceProfile })
        .exec();
      console.log("---------resp-------", resp);
      finalData.push(resp);
    }

    return res.status(200).json(finalData);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.bookService = async (req, res, next) => {
  try {
    let payload = {
      type: "sp",
      numberOfPets: 2,
      petDetails: [
        {
          petId: "",
          size: "medium",
        },
        {
          petId: "",
          size: "large",
        },
      ],
      specialInstructions: "",
      petBehaviour: {
        pullsOnTheLeash: true,
        likeInteractingWithOtherDogsOrPeople: true,
        jumpsUpOnPeopleAndThings: true,
        chaseSmallerAnimals: true,
        protectiveOfHome: true,
      },
      petRunningLocation: {
        addressLine1: "shani chowk",
        addressLine2: "rahata",
        state: "maharashtra",
        city: "rahata",
        pinCode: "423107",
      },
      phone: "7385440392",
      alternatePhone: ["9579902562"],
      package: {
        description: "Monthly",
        amount: "400",
        frequency: "Weekly",
      },
      startDate: "09/11/2021",
      dayOff: "Sun",
      run1: "06:30 am",
      run2: "07:30 pm",
      paymentDetails: {
        transactionId: "",
        Status: "Success",
      },
      bookingStatus: "Dog Runner will be assigned shortly",
    };
    let ServiceBookingModel = new bookingDetails(payload);
    let resp = await ServiceBookingModel.save();
    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

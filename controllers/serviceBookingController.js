const ServiceType = require("../models/ServiceType");
const { petDetails, bookingDetails } = require("../models/ServiceBooking");
const {
  Service,
  BackgroundCheck,
  DogWalkingPreferences,
  ReviewsandRatings,
  ServiceProfile,
  ServiceAppointment,
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
      numberOfPets: req.body.numberOfPets,
      petDetails: [],
      specialInstructions: req.body.specialInstructions,
      petBehaviour: req.body.petBehaviour,
      petRunningLocation: req.body.petRunningLocation,
      phone: req.body.phone,
      alternatePhone: req.body.alternatePhone,
      package: req.body.package,
      startDate: new Date(req.body.startDate).toISOString(),
      dayOff: req.body.dayOff,
      run1: req.body.run1,
      run2: req.body.run2,
    };

    let petArr = [];
    for (let p1 of req.body.petDetails) {
      petArr.push({
        pet: p1.petId,
        size: p1.size,
      });
    }

    let petArr1 = [];
    for (let p1 of req.body.petDetails) {
      petArr1.push(p1.petId);
    }
    payload.petDetails = petArr;

    let ServiceBookingModel = new bookingDetails(payload);
    let resp = await ServiceBookingModel.save();

    let getServiceProviders = await Service.find({});
    for (let sp1 of getServiceProviders) {
      let ServiceAppointmentSave = new ServiceAppointment({
        ServiceProvider: sp1._id,
        User: res.locals.user._id,
        bookingDetails: ServiceBookingModel._id,
        petDetails: petArr1,
        startTIme: new Date(req.body.startDate).toISOString(),
        bookingStatus: false,
      });
      let resp = await ServiceAppointmentSave.save();
    }

    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

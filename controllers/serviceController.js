const ServiceType = require("../models/ServiceType");
const { Service, BackgroundCheck } = require("../models/Service");
const ObjectId = require("mongoose").Types.ObjectId;
const logger = require("../logger/logger");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports.serviceList = async (req, res, next) => {
  try {
    let servicesList = await ServiceType.find();
    return res.status(201).json({ services: servicesList });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.createService = async (req, res, next) => {
  try {
    let ServiceModel = new Service({
      serviceProvider: res.locals.user._id,
      serviceType: req.body.serviceType,
    });
    let resp = await ServiceModel.save();
    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.addBackgroundCheckToService = async (req, res, next) => {
  try {
    console.log(
      "------inside addBackgroundCheckToService route-------",
      req.body.type,
      req.body.serviceId,
      req.body.email,
      req.body.phone,
      req.body.dob,
      req.body.references
    );
    let fileArr = [];
    for (let fl of req.files) {
      const response = await cloudinary.uploader.upload(fl.path, {
        width: 200,
        height: 200,
        gravity: "face",
        crop: "thumb",
      });

      fileArr.push({
        fieldname: fl.fieldname,
        url: response.secure_url,
      });

      fs.unlinkSync(fl.path);
    }
    console.log(
      "---------fileArr---------",
      fileArr.find((el) => el.fieldname === "adharFront")
    );

    let BackgroundCheckModel = new BackgroundCheck({
      service: req.body.serviceId,
      adharFront: fileArr.find((el) => el.fieldname === "adharFront").url,
      adharBack: fileArr.find((el) => el.fieldname === "adharBack").url,
      pan: fileArr.find((el) => el.fieldname === "pan").url,
      picture: fileArr.find((el) => el.fieldname === "picture").url,
      bankStatement: fileArr.find((el) => el.fieldname === "bankStatement").url,
      email: req.body.email,
      phone: req.body.phone,
      dob: req.body.dob,
      references: JSON.parse(req.body.references),
    });

    await Service.findByIdAndUpdate(
      { _id: req.body.serviceId },
      { backgroundCheck: BackgroundCheckModel._id, isBackgroundCheck: true }
    );
    let resp = await BackgroundCheckModel.save();
    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

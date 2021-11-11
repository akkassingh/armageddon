const ServiceType = require("../models/ServiceType");
const {
  Service,
  BackgroundCheck,
  DogWalkingPreferences,
  ReviewsandRatings,
  ServiceProfile,
  ServiceAppointment,
  ServiceReport
} = require("../models/Service");
const ObjectId = require("mongoose").Types.ObjectId;
const logger = require("../logger/logger");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Animal = require("../models/Animal");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports.serviceList = async (req, res, next) => {
  try {
    // let servicesList = await ServiceType.find();
    let serviceList = await Service.find({
      serviceProvider: res.locals.user._id,
    });
    let count=await ServiceAppointment.find({ServiceProvider: res.locals.user._id})

    return res.status(201).json({ services: serviceList[0].serviceType, serviceStatus: serviceList[0].isVerified, appointments:count.length });
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
      //   const response = await cloudinary.uploader.upload(fl.path, {
      //     width: 200,
      //     height: 200,
      //     gravity: "face",
      //     crop: "thumb",
      //   });
      const response = await cloudinary.uploader.upload(fl.path);

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
      isadharCheck: true,
      ispanCheck: true,
      ispictureCheck: true,
      isbankStatementCheck: true,
      isemailCheck: true,
      isphoneCheck: true,
      isdobCheck: true,
      isreferencesCheck: true,
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

module.exports.BackgroundCheckStatus = async (req, res, next) => {
  try {
    let resp = await BackgroundCheck.findOne({service:req.body.serviceId})
    if(!resp)
    return res.status(404).send('NO background check found!');

    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};


module.exports.isSentforApproval = async (req, res, next) => {
  try {
    let resp = await BackgroundCheck.findOneAndUpdate({service:req.body.serviceId},
      {isSentforApproval:true})
    if(!resp)
    return res.status(404).send('NO background check found!');

    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};
module.exports.addServiceProfile = async (req, res, next) => {
  try {
    console.log("------inside addServiceProfile route-------");
    let fileArr = [];
    for (let fl of req.files) {
      const response = await cloudinary.uploader.upload(fl.path);
      fileArr.push(response.secure_url);
      fs.unlinkSync(fl.path);
    }

    let ServiceProfileModel = new ServiceProfile({
      service: req.body.serviceId,
      mainLine: req.body.mainLine,
      description: req.body.description,
      address: req.body.address,
      pictures: fileArr,
    });
    await Service.findByIdAndUpdate(
      { _id: req.body.serviceId },
      { ServiceProfile: ServiceProfileModel._id, isServiceProfile: true }
    );
    let resp = await ServiceProfileModel.save();
    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getServiceProfile = async (req, res, next) => {
  try {
    let resp = await Service.findById({_id:req.body.serviceId}).populate('ServiceProfile')
  

    return res.status(200).json(resp.ServiceProfile);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.addDogWalkingPreferences = async (req, res, next) => {
  try {
    let DogWalkingPreferencesModel = new DogWalkingPreferences({
      service: req.body.serviceId,
      availableDays: req.body.availableDays,
      weekDayTimings: req.body.weekDayTimings,
      weekendTimings: req.body.weekendTimings,
      dogSizes: req.body.dogSizes,
      serviceAreaRadius: req.body.serviceAreaRadius,
      covidVaccinated: req.body.covidVaccinated,
      ableToRunWithDogs: req.body.ableToRunWithDogs,
      ableToAdministerMedicine: req.body.ableToAdministerMedicine,
      ableToTakeCareOfSeniorDogs: req.body.ableToTakeCareOfSeniorDogs,
      ableToTakeCareOfSpecialNeeds: req.body.ableToTakeCareOfSpecialNeeds,
      ableToManageHighEnergyDogs: req.body.ableToManageHighEnergyDogs,
      ableToWalkFaster: req.body.ableToWalkFaster,
      ableToManageDogsWhoPull: req.body.ableToManageDogsWhoPull,
      ableToTakeCareOfPuppies: req.body.ableToTakeCareOfPuppies,
      ableToTrainDogs: req.body.ableToTrainDogs,
    });

    console.log(
      "----------DogWalkingPreferencesModel----------",
      DogWalkingPreferencesModel
    );
    await Service.findByIdAndUpdate(
      { _id: req.body.serviceId },
      {
        dogWalkingPreferences: DogWalkingPreferencesModel._id,
        isDogWalkingPreferences: true,
      }
    );
    let resp = await DogWalkingPreferencesModel.save();
    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getDogWalkingPreferences = async (req, res, next) => {
  try {
    let resp = await Service.findById({_id:req.body.serviceId}).populate('dogWalkingPreferences')
  

    return res.status(200).json(resp.dogWalkingPreferences);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.sendReviewsandRatings = async (req, res, next) => {
  try {
    let resp = await ReviewsandRatings.findOne({service:req.body.serviceId})
  

    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getCreatedServicesList = async (req, res, next) => {
  try {
    let serviceList = await Service.find({
      serviceProvider: res.locals.user._id,
    });

    let finalData = [];

    for (let s1 of serviceList) {
      let resp = await Service.findById({ _id: s1._id })
        .populate({ path: "backgroundCheck", model: BackgroundCheck })
        .populate({
          path: "dogWalkingPreferences",
          model: DogWalkingPreferences,
        })
        .populate({ path: "ServiceProfile", model: ServiceProfile })
        .populate({ path: "ServiceAppointment", model: ServiceAppointment })
        .exec();
      //console.log("---------resp-------", resp);
      let count=await ServiceAppointment.find({ServiceProvider: res.locals.user._id})
      // resp.appointmentLength=resp.ServiceAppointment.length
     
      finalData.push(resp);
      finalData.push(count.length);

    }
    

    return res.status(200).json(finalData);
  } catch (err) {
    console.log(err);
    next(err);
  }
};


module.exports.getmyAppointments = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.find({
      ServiceProvider: res.locals.user._id,
    }).populate({path:'bookingDetails'}).populate({path:'petDetails'});    
    return res.status(200).json(serviceList);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.changeAppointmentstatus = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.findByIdAndUpdate(     
      { _id: req.body.appointmentId },
      { bookingStatus: req.body.bookingStatus},
      { new: true });
    return res.status(200).json(serviceList);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getAppointmentDetails = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.findById(     
      { _id: req.body.appointmentId }).populate('bookingDetails').populate('petDetails');
    return res.status(200).json(serviceList);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.endService = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.findByIdAndUpdate(     
      { _id: req.body.appointmentId },
      {serviceStatus:true});
    return res.status(200).json(serviceList);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.generateReport = async (req, res, next) => {
  try {
    let fileArr = [];
    for (let fl of req.files) {
      const response = await cloudinary.uploader.upload(fl.path);
      fileArr.push(response.secure_url);
      fs.unlinkSync(fl.path);
    }
    let ServiceReportModel = new ServiceReport({
      ServiceProvider: req.body.ServiceProvider,
      User: req.body.mainLine, //populate from appointment
      //add array of lat long
      distance: req.body.distance,
      time: req.body.time,
      ServiceAppointment: req.body.appointmentId,
      pee: req.body.pee,
      poo: req.body.poo,
      rating: req.body.rating,
      pictures: fileArr,
    });
    let resp = await ServiceReportModel.save();
    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};
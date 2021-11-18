const ServiceType = require("../models/ServiceType");
const User = require("../models/User");
const Animal = require("../models/Animal");
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
    console.log(req.body.runDetails[0].runTime)
    let arr=[],dayoff=[]
    let j=0;
    let start=req.body.startDate;
    let off=req.body.dayOff;
    for(let i=0;i<req.body.package.frequency;i++){
      if(i>0 && i%7==0)
        j++;
        const runningDate=86400000*i+start;
        const checkDate=604800000*j+off
        const event = formatDate(new Date(parseInt(runningDate)));
        const eventcheck = formatDate(new Date(parseInt(checkDate)));
        // console.log(eventcheck)
        if(event!=eventcheck){
          let ob;
          if(req.body.package.dayfrequency==2){
             ob={
              runTime1:req.body.runDetails[0].runTime,
              runTime2:req.body.runDetails[1].runTime,
              runDate:event
            }
          }
          else{
             ob={
              runTime1:req.body.runDetails[0].runTime,
              runDate:event
            }
          }
          arr.push(ob)
        }
        else{
            dayoff.push({"off":event})

        }
    }
    let payload = {
      type: "sp",
      numberOfPets: req.body.numberOfPets,
      petDetails: [],
      specialInstructions: req.body.specialInstructions,
      petBehaviour: req.body.petBehaviour,
      petRunningLocation: req.body.petRunningLocation,
      phone: req.body.phone,
      alternateName: req.body.alternateName,
      alternatePhone: req.body.alternatePhone,
      package: req.body.package,
      run1:req.body.runDetails[0].runTime,
      run2:`${req.body.runDetails[1] ? req.body.runDetails[1].runTime : ""}`,
     // req.body.runDetails[1].runTime,
      runDetails:arr,
      startDate:formatDate(new Date(parseInt(req.body.startDate))),
      dayOff: dayoff
      //(new Date(req.body.dayOff).toDateString()).split(' ')[0],
    };
    // console.log(payload)
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
        ServiceProvider: sp1.serviceProvider,
        User: res.locals.user._id,
        bookingDetails: ServiceBookingModel._id,
        petDetails: petArr1,
        // startTIme: new Date(req.body.startDate).toISOString(),
        bookingStatus: false,
      });
      let st=await  Service.findOneAndUpdate({ serviceProvider: sp1.serviceProvider,ServiceAppointment:ServiceAppointmentSave._id} )
       resp = await ServiceAppointmentSave.save();
      //console.log(st)
    }

    return res.status(200).json(resp);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getPetDetails = async (req, res, next) => {
  try {
    let serviceList = await User.findById({_id:res.locals.user._id}).populate({ path: "pets.pet", select:'name username _id', model: Animal })
    //.populate('pets.pet',)
    //,'name username _id ');

    

    return res.status(200).send({pets:serviceList.pets});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}
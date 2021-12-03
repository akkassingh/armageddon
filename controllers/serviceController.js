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
const {bookingDetails}=require("../models/ServiceBooking")
const ObjectId = require("mongoose").Types.ObjectId;
const logger = require("../logger/logger");
const fs = require("fs");
const Animal = require("../models/Animal");
const ServiceProvider=require("../models/ServiceProvider")
const cloudinary = require("cloudinary").v2;
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

module.exports.getServiceProviderProfile = async (req, res, next) => {
  try {
    // let servicesList = await ServiceType.find();
    let serviceList = await ServiceProvider.findById({
      _id: res.locals.user._id},'fullName username bio website avatar');
    // let count=await ServiceAppointment.find({ServiceProvider: res.locals.user._id})

    return res.status(201).json({ services: serviceList});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.createService = async (req, res, next) => {
  try {
    if(! await Service.findOne({
      serviceProvider: res.locals.user._id,
      serviceType: req.body.serviceType,
      })){
      let ServiceModel = new Service({
        serviceProvider: res.locals.user._id,
        serviceType: req.body.serviceType,
      });
      let resp = await ServiceModel.save();
      return res.status(200).json(resp);
    }
    else return res.status(200).send({msg:"This service has already been created"});

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
    // await BackgroundCheck.deleteMany({ service: req.body.serviceId})
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
      var resp ={}
       resp=await Service.findById({ _id: s1._id })
        // .populate({ path: "backgroundCheck", model: BackgroundCheck })
        // .populate({
        //   path: "dogWalkingPreferences",
        //   model: DogWalkingPreferences,
        // })
        // .populate({ path: "ServiceProfile", model: ServiceProfile })
        // .populate({ path: "ServiceAppointment", model: ServiceAppointment })
        // .exec();
      //console.log("---------resp-------", resp);
      // let count=await ServiceAppointment.find({ServiceProvider: res.locals.user._id})
      // resp.appointmentLength=resp.ServiceAppointment.length
      // resp['appointmentCount']=count.length;

        // let a= {appointmentCount:count.length}
        //resp.push(a)
      finalData.push(resp);
      //finalData1.push(a);

    }
    
    

    return res.status(200).send({createdServicelist:finalData});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//add time>starttime
module.exports.getmyactiveAppointments = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.find({
      ServiceProvider: res.locals.user._id,
      bookingStatus:{ $lte:1}
    }).populate('bookingDetails','package run1 run2 startDate dayOff paymentDetails numberOfPets').populate('petDetails', 'name username').populate('User','fullName username avatar');
    console.log(serviceList)
    serviceList = serviceList.filter(function (ele) {
      return ele.bookingDetails.paymentDetails.status == 1;
    });   
    for(let i=0;i<serviceList.length;i++){
      if(serviceList[i].petDetails==null){
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
        serviceList[i].petDetails.push(pet)
      }
      if(serviceList[i].petDetails.length==1 && serviceList[i].bookingDetails.numberOfPets==2){
        console.log('looooooo')
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
        serviceList[i].petDetails.push(pet)
      }
    }
    return res.status(200).json({serviceList:serviceList});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getmypastAppointments = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.find({
      ServiceProvider: res.locals.user._id,
      bookingStatus:{ $gte:2} //recieved=0,accepted(confirmed=1).rejected(cancelled)=2,completed=3
    }).populate('bookingDetails','package run1 run2 paymentDetails numberOfPets').populate('petDetails', 'name username').populate('User','fullName username avatar');
    serviceList = serviceList.filter(function (ele) {
      return ele.bookingDetails.paymentDetails.status == 1;
    });
    for(let i=0;i<serviceList.length;i++){
      if(serviceList[i].petDetails==null){
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
        serviceList[i].petDetails.push(pet)
      }
      if(serviceList[i].petDetails.length==1 && serviceList[i].bookingDetails.numberOfPets==2){
        console.log('looooooo')
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
        serviceList[i].petDetails.push(pet)
      }
    }
    return res.status(200).json({serviceList:serviceList});
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
    if(req.body.bookingStatus==1){
      await ServiceAppointment.deleteMany({ _id: { $nin: [ObjectId(req.body.appointmentId)] } })
      await bookingDetails.findByIdAndUpdate({_id:serviceList.bookingDetails},{status:1})
    }
    //if booking status =3 =>servicestatus=2
    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getscrollAppointmentstatus = async (req, res, next) => {
  try {
    let resp=[];
    let status;
    let serviceList = await ServiceAppointment.findById(     
      { _id: req.body.appointmentId }).populate('bookingDetails');
      const count=serviceList.bookingDetails.runDetails.length;
      for(let i=0;i<count;i++){
        if(serviceList.bookingDetails.runDetails[i].runDate==formatDate(new Date(parseInt(req.body.date)))){
          status=serviceList.bookingDetails.runDetails[i].run1Status
          resp.push({"walkStatus":status})
          // if(serviceList.bookingDetails.runDetails[i].run2Status){
            status=serviceList.bookingDetails.runDetails[i].run2Status
            resp.push({"walkStatus":status})
         // }
        }
      }
    return res.status(200).send({resp:resp});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.changeRunstatus = async (req, res, next) => {
  try {
    let resp=[];
    let status;
    let rep = await ServiceAppointment.findById(     
      { _id: req.body.appointmentId }).populate('bookingDetails');
      p=await bookingDetails.findById({_id:rep.bookingDetails._id})
      const count=p.runDetails.length;

      for(let i=0;i<count;i++){
        let p1=p.runDetails;
        if(p.runDetails[i].runDate==formatDate(new Date(req.body.date))){
          if(req.body.run1Status){
            p1[i].run1Status=req.body.run1Status;
            p=await bookingDetails.findByIdAndUpdate({_id:rep.bookingDetails._id},{$set:{runDetails:p1}},{ new: true })
          }
          if(req.body.run2Status){
            p1[i].run2Status=req.body.run2Status;
            console.log( p1[i].run2Status+'loooooooo')
            p=await bookingDetails.findByIdAndUpdate({_id:rep.bookingDetails._id},{$set:{runDetails:p1}},{ new: true })
          }
        }
      }
      
    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getAppointmentDetails = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.findById(     
      { _id: req.body.appointmentId }).populate('bookingDetails').populate('petDetails').populate('User','fullName username avatar');     
      console.log(serviceList)
      let count=serviceList.bookingDetails.runDetails.length;
      if (serviceList.bookingDetails.paymentDetails.status){
      if(serviceList.bookingDetails.runDetails[count-1].run1Status){
        if(serviceList.bookingDetails.runDetails[count-1].runTime2){
          if(serviceList.bookingDetails.runDetails[count-1].run2Status){
            if(serviceList.serviceStatus==0){
              await ServiceAppointment.findByIdAndUpdate(     
                { _id: req.body.appointmentId },{serviceStatus:1});
                serviceList.serviceStatus=1;
            }
          }
        }
        else{
          
        await ServiceAppointment.findByIdAndUpdate(     
          { _id: req.body.appointmentId },{serviceStatus:1});
          serviceList.serviceStatus=1;
        }
      }
    }
      serviceList.bookingDetails.runDetails=[]
      if(serviceList.petDetails==null){
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
        serviceList.petDetails.push(pet)
      }
      if(serviceList.petDetails.length==1 && serviceList.bookingDetails.numberOfPets==2){
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
        serviceList.petDetails.push(pet)
      }
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
      {serviceStatus:1});
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

      fileArr.push({
        fieldname: fl.fieldname,
        url: response.secure_url,
      });

      fs.unlinkSync(fl.path);
    }
    console.log(req.body.reperate)
    if(!req.body.rating){

    }
    let ServiceReportModel = new ServiceReport({
      ServiceProvider: req.body.ServiceProvider,
      User: req.body.mainLine, //populate from appointment
      //add array of lat long
      distance: req.body.distance,
      time: req.body.time,
      ServiceAppointment: req.body.appointmentId,
      // pee: req.body.pee,
      reperate: JSON.parse(req.body.reperate),
      // pet:req.body.petId,
      rating: req.body.rating,
      picture: fileArr.find((el) => el.fieldname === "picture").url,
      map: fileArr.find((el) => el.fieldname === "map").url,

    });
    let p;
    let dt=new Date(parseInt(req.body.date))
    let resp = await ServiceReportModel.save();
    let rep=await ServiceAppointment.findById({_id:req.body.appointmentId}).populate('bookingDetails','runDetails.runDate');
    for(let i=0;i<rep.bookingDetails.runDetails.length;i++){
      if(rep.bookingDetails.runDetails[i].runDate==formatDate(dt)){
        if(req.body.runReport1){
          p=await bookingDetails.findById({_id:rep.bookingDetails._id})
          let p1=p.runDetails;
          p1[i].runReport1=ServiceReportModel._id;
          p=await bookingDetails.findByIdAndUpdate({_id:rep.bookingDetails._id},{$set:{runDetails:p1}},{ new: true })
        }
        else if(req.body.runReport2){
          p=await bookingDetails.findById({_id:rep.bookingDetails._id})
          let p1=p.runDetails;
          p1[i].runReport2=ServiceReportModel._id;
          console.log(p1[i])

          p=await bookingDetails.findByIdAndUpdate({_id:rep.bookingDetails._id},{$set:{runDetails:p1}},{ new: true })
        }
      }
      //  await bookingDetails.findByIdAndUpdate({_id:rep.bookingDetails._id},{runReport2:ServiceReportModel._id})   
     }

    //console.log(rep.bookingDetails.runDetails);

    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getReport = async (req, res, next) => {
  try {
    let resp;
    let dt=new Date(parseInt(req.body.date))
    let rep=await ServiceAppointment.findById({_id:req.body.appointmentId}).populate('bookingDetails','runDetails');
    for(let i=0;i<rep.bookingDetails.runDetails.length;i++){
      if(rep.bookingDetails.runDetails[i].runDate==formatDate(dt)){
        if(req.body.runReport1){       
          resp=await ServiceReport.findById({_id:rep.bookingDetails.runDetails[i].runReport1})
        }
        else  if(req.body.runReport2){       
          resp=await ServiceReport.findById({_id:rep.bookingDetails.runDetails[i].runReport2})
        }
      }
     }
     formatDate(new Date(parseInt(req.body.date)))
    return res.status(200).send(resp);
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

module.exports.postPayment = async (req, res, next) => {
  const {bookingId, transactionId, amount} = req.body;
  const user = res.locals.user;
  if (!bookingId) {
    return res.status(400).send({"error": "Invalid Request!"})
  }
  try{
    const bookingStatus = await bookingDetails.findById(bookingId, 'paymentDetails');
    if (!bookingStatus){
      return res.status(404).send({"error" : "No Booking Found with given credentials!"});
    }
    if (!bookingStatus.paymentDetails.status){
      await bookingDetails.updateOne(
        {
          "_id" : bookingId
        },
        {
          "paymentDetails.transactionId" : transactionId,
          "paymentDetails.status" : 1,
          "paymentDetails.amount" : amount,
        });
      return res.status(201).send({"success" : true})
    }
    else {
      return res.status(200).send({error : "Your booking has been already registered!"})
    }
  }
  catch (err) {
    console.log(err);
    next(err);
  }
}
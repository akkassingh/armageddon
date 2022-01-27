const ServiceType = require("../models/ServiceType");
const User = require("../models/User");
const Quickblox = require("../models/Quickblox");
const Animal = require("../models/Animal");
const { petDetails, bookingDetails } = require("../models/ServiceBooking");
const {
  Service,
  BackgroundCheck,
  DogWalkingPreferences,
  ReviewsandRatings,
  ServiceProfile,
  ServiceAppointment,
  ServiceReport
} = require("../models/Service");

const { ServiceProvider } = require("../models/ServiceProvider");
const ObjectId = require("mongoose").Types.ObjectId;
const logger = require("../logger/logger");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
var generator = require('generate-password');

const {notifyUser, formatCloudinaryUrl} = require("../utils/controllerUtils");
const Razorpay = require("razorpay");
var QB = require('quickblox');
// var QB = new QuickBlox();
var CREDENTIALS = {
  appId: 95010,
  authKey: 'tgz8MQ-QkPWnyZS',
  authSecret: 'SgK6cfKa7Q4Yy4T',
  accountKey: 'ea8RxFFV8cCxaYYfZ_vC'
};
var CONFIG = { debug: true };

QB.init(CREDENTIALS.appId, CREDENTIALS.authKey, CREDENTIALS.authSecret, CREDENTIALS.accountKey);

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
          // console.log(order);
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
    await ServiceAppointment.deleteMany({User:'61dde0a14d2344eb0d4db122'})

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
    // console.log(req.body.runDetails[0].runTime)
    let arr=[],dayoff=[]
    let j=0;
    let start=req.body.startDate;
    // let off=req.body.dayOff;
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    // let off=req.body.dayOff;
    for(let i=0;i<req.body.package.frequency;i++){
      // if(i>0 && i%7==0)
      //   j++;
        const runningDate=86400000*i+start;
        // const checkDate=604800000*j+off
        const event = formatDate(new Date(parseInt(runningDate)));
        const eventcheck = new Date(parseInt(runningDate)) 
        let day=days[eventcheck.getDay()]
        // console.log(event,day)
        // console.log(eventcheck)
        if(day!='Sunday'){
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
      location: { type: 'Point', coordinates:[req.body.longitude, req.body.latitude] },
      phone: req.body.phone,
      alternateName: req.body.alternateName,
      alternatePhone: req.body.alternatePhone,
      package: req.body.package,
      run1:req.body.runDetails[0].runTime,
      run2:`${req.body.runDetails[1] ? req.body.runDetails[1].runTime : ""}`,
     // req.body.runDetails[1].runTime,
      runDetails:arr,
      startDate:formatDate(new Date(parseInt(req.body.startDate))),
      start:new Date(parseInt(req.body.startDate)),
      dayOff: dayoff,
      // User:'61dc497c4f60822f13e5c4fb',
      User: res.locals.user._id
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
        // User:'61dc497c4f60822f13e5c4fb',
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

     res.status(200).send({bookingId:ServiceBookingModel._id});
    let result= await quickbloxRegistration(ServiceBookingModel._id)
    } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.reorder = async (req, res, next) => {
  const {bookingId} = req.body;
  const user = res.locals.user;
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  try{
    const booking = await bookingDetails.findById(bookingId);
    let arr=[],dayoff=[]
    let j=0;
    let newStartDate = new Date(booking.startDate);
    newStartDate.setDate(newStartDate.getDate() + 31)
    // let newOffDate = new Date(booking.dayOff[booking.dayOff.length -1].off);
    // newOffDate.setDate(newOffDate.getDate() + 7);
    let start= newStartDate.getTime();
    // let off=newOffDate.getTime();
    for(let i=0;i<booking.package.frequency;i++){
      // if(i>0 && i%7==0)
      //   j++;
        const runningDate=86400000*i+start;
        // const checkDate=604800000*j+off
        const event = formatDate(new Date(parseInt(runningDate)));
        const eventcheck = new Date(parseInt(runningDate));
        let day=days[eventcheck.getDay()]
        // console.log(eventcheck)
        if(day!='Sunday'){
          let ob;
          if(booking.package.dayfrequency==2){
             ob={
              runTime1:booking.run1 ? booking.run1 : "",
              runTime2:booking.run2 ? booking.run2 : "",
              runDate:event
            }
          }
          else{
             ob={
              runTime1:booking.run1,
              runDate:event
            }
          }
          arr.push(ob)
        }
        // else{
        //     dayoff.push({"off":event})

        // }
    }
    let payload = {
      type: "sp",
      numberOfPets: booking.numberOfPets,
      petDetails: [],
      specialInstructions: booking.specialInstructions,
      petBehaviour: booking.petBehaviour,
      petRunningLocation: booking.petRunningLocation,
      location: { type: 'Point', coordinates:[booking.location ? booking.location.coordinates[0] : null, booking.location ? booking.location.coordinates[1] : null] },
      phone: booking.phone,
      alternateName: booking.alternateName,
      alternatePhone: booking.alternatePhone,
      package: booking.package,
      run1:booking.run1 ? booking.run1 : "",
      run2:booking.run2 ? booking.run2 : "",
     // req.body.runDetails[1].runTime,
      runDetails:arr,
      startDate:formatDate(new Date(parseInt(start))),
      start:new Date(parseInt(start)),
      // dayOff: dayoff,
      // User:'61dc497c4f60822f13e5c4fb',
      User: booking.User,
      //(new Date(req.body.dayOff).toDateString()).split(' ')[0],
    };
    let petArr = booking.petDetails;
    let petArr1 = [];
    for (let p1 of booking.petDetails) {
      petArr1.push(p1.pet);
    }
    payload.petDetails = petArr;
    let ServiceBookingModel = new bookingDetails(payload);
    let resp = await ServiceBookingModel.save();
    let getServiceProviders = await Service.find({});
    for (let sp1 of getServiceProviders) {
      let ServiceAppointmentSave = new ServiceAppointment({
        ServiceProvider: sp1.serviceProvider,
        // User:'61dc497c4f60822f13e5c4fb',
        User: res.locals.user._id,
        bookingDetails: ServiceBookingModel._id,
        petDetails: petArr1,
        // startTIme: new Date(req.body.startDate).toISOString(),
        bookingStatus: false,
      });
      let st = await  Service.findOneAndUpdate({ serviceProvider: sp1.serviceProvider,ServiceAppointment:ServiceAppointmentSave._id} )
      resp = await ServiceAppointmentSave.save();
      //console.log(st)
    }

    res.status(200).send({bookingId:ServiceBookingModel._id, success: true, amount : booking.package.amount});
    let result= await quickbloxRegistration(ServiceBookingModel._id)
    
  }
  catch(err){
    console.log(err)
    next(err)
  }
}

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

module.exports.getmybookedAppointments = async (req, res, next) => {
  const today = new Date();
  try {
    let serviceList1=[]
    let serviceList = await bookingDetails.find({
      User: res.locals.user._id,
      status:{ $lte:0} //recieved=0,accepted(confirmed=1).rejected(cancelled)=2,completed=3
    });
    for(let i=0;i<serviceList.length;i++){
      let obj= await ServiceAppointment.findOne({
        bookingDetails: serviceList[i]._id,
        bookingStatus:0
      }).populate('bookingDetails','package run1 run2 startDate dayOff paymentDetails numberOfPets').populate('petDetails', 'name username').populate('ServiceProvider','fullName username avatar').lean(); 
      console.log(obj)
      if(obj!=null && obj.petDetails.length==0){
        console.log('hiiiiii')
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
     obj.petDetails.push(pet)
      }
      if(obj!=null && obj.petDetails.length==1 && obj.bookingDetails.numberOfPets==2){
        console.log('hiiiiii')
        let pet={
          name:"dog",
          username:"dog",
          _id:"1"
        }
     obj.petDetails.push(pet)
      }
      let startDate = new Date(obj.bookingDetails.startDate);
      let daysLeft = Math.ceil((startDate - today + 30) / (1000 * 60 * 60 * 24)); 
      obj.daysLeft = daysLeft;
      if(obj!=null && obj.bookingDetails.paymentDetails.status)
      serviceList1.push(obj);
    }   
    return res.status(200).json({serviceList:serviceList1});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getmyactiveAppointments = async (req, res, next) => {
  const today = new Date();
  try {
    let serviceList = await ServiceAppointment.find({
      User: res.locals.user._id,
      bookingStatus:1
    }).populate('bookingDetails','package run1 run2 startDate dayOff paymentDetails numberOfPets').populate('petDetails', 'name username').populate('ServiceProvider','fullName username avatar').lean();     
    serviceList = serviceList.filter(function (ele){
      return ele.bookingDetails.paymentDetails.status == 1;
    })
    for(let i=0;i<serviceList.length;i++){
      if(serviceList[i].petDetails==null || serviceList[i].petDetails.length==0){
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
      let startDate = new Date(serviceList[i].bookingDetails.startDate);
      let daysLeft = Math.ceil((startDate - today + 30) / (1000 * 60 * 60 * 24)); 
      serviceList[i].daysLeft = daysLeft;
    }
    return res.status(200).json({serviceList:serviceList});
  } catch (err) {
    console.log(err);
    next(err);
  }
};


module.exports.getmypastAppointments = async (req, res, next) => {
  const today = new Date();
  try {
    let serviceList = await ServiceAppointment.find({
      User: res.locals.user._id,
      bookingStatus:{ $gte:3} //recieved=0,accepted(confirmed=1).rejected(cancelled)=2,completed=3
    }).populate('bookingDetails','package run1 run2 paymentDetails numberOfPets startDate').populate('petDetails', 'name username').populate('ServiceProvider','fullName username avatar').lean();       
    serviceList.filter(function (ele){
      return ele.bookingDetails.paymentDetails.status == 1;
    })   
    for(let i=0;i<serviceList.length;i++){
      if(serviceList[i].petDetails==null || serviceList[i].petDetails.length==0){
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
      let startDate = new Date(serviceList[i].bookingDetails.startDate);
      let daysLeft = Math.ceil((startDate - today + 30) / (1000 * 60 * 60 * 24)); 
      serviceList[i].daysLeft = daysLeft;
    }
    return res.status(200).json({serviceList:serviceList});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getAppointmentDetails = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.findOne(     
      { bookingDetails: req.body.bookingDetailsId }).populate('bookingDetails').populate('petDetails').populate('ServiceProvider','fullName username avatar');     
      console.log(serviceList)
        if(serviceList.petDetails==null || serviceList.petDetails.length==0){
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
      
      if (serviceList.bookingDetails.paymentDetails.status){
        serviceList.bookingDetails.runDetails=[]
        return res.status(200).json(serviceList);
      }
      else{
        return res.status(200).send({error : "Payment Not Done for this Service!"})
      }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getscrollAppointmentstatus = async (req, res, next) => {
  try {
    let resp=[];
    let status;
    let serviceList = await ServiceAppointment.findOne(     
      { bookingDetails: req.body.bookingDetailsId }).populate('bookingDetails').populate('ServiceProvider','fullName username avatar'); 
      const count=serviceList.bookingDetails.runDetails.length;
      for(let i=0;i<count;i++){
        if(serviceList.bookingDetails.runDetails[i].runDate==formatDate(new Date(parseInt(req.body.date))) && 
            serviceList.bookingDetails.paymentDetails.status){
          status=serviceList.bookingDetails.runDetails[i].run1Status
          resp.push({"walkStatus":status})
          // if(serviceList.bookingDetails.runDetails[i].run2Status){
            status=serviceList.bookingDetails.runDetails[i].run2Status
            resp.push({"walkStatus":status})
         // }
        }
      }
    return res.status(200).send({resp:resp});
    // return res.status(200).send({resp: 1});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.changeAppointmentstatus = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.updateMany(     
      { bookingDetails: req.body.bookingDetailsId },
      { bookingStatus: req.body.bookingStatus},
      { new: true });
    // if(req.body.bookingStatus==1){
    //   await ServiceAppointment.deleteMany({ _id: { $nin: [ObjectId(req.body.appointmentId)] } })
    //   await bookingDetails.findByIdAndUpdate({_id:serviceList.bookingDetails},{status:1})
    // }
    if(req.body.bookingStatus==3){
      await ServiceAppointment.findOneAndUpdate(     
        { bookingDetails: req.body.bookingDetailsId },
        { serviceStatus: 2},
        { new: true });
    }
    //if booking status =3 =>servicestatus=2
    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.giveRatingstoeachWalk=async (req, res, next) => {
  try {
    // let serviceList = await ServiceAppointment.findOneAndUpdate(     
    //   { bookingDetails: req.body.bookingDetailsId },
    //   {rating:req.body.rating},
    //   { new: true });
    let dt=new Date(parseInt(req.body.date))
    let rep=await bookingDetails.findById({_id:req.body.bookingDetailsId});
    for(let i=0;i<rep.runDetails.length;i++){
      if(rep.runDetails[i].runDate==formatDate(dt)){
          p=await ServiceAppointment.findOneAndUpdate({bookingDetails:req.body.bookingDetailsId},{$set:{rating:req.body.rating}},{ new: true })
      }
    }
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
    let rep=await bookingDetails.findById({_id:req.body.bookingDetailsId});
    for(let i=0;i<rep.runDetails.length;i++){
      if(rep.runDetails[i].runDate==formatDate(dt)){
        if(req.body.runReport1){       
          resp=await ServiceReport.findById({_id:rep.runDetails[i].runReport1})
        }
        else  if(req.body.runReport2){       
          resp=await ServiceReport.findById({_id:rep.runDetails[i].runReport2})
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


module.exports.giveTestimony = async (req, res, next) => {
  try {
    let serviceList = await ServiceAppointment.findOneAndUpdate(     
      { bookingDetails: req.body.bookingDetailsId },
      {rating:req.body.rating,
      review:req.body.review,
      israted:true
      });
    return res.status(200).send({success:true});
  } catch (err) {
    console.log(err);
    next(err);
  }
};


module.exports.getQuickbloxDetails = async (req, res, next) => {
  try {
    let resp=await Quickblox.findOne({userLogin:req.body.userLogin})
    // var params = { login: resp.userLogin, password: resp.userPassword };
    // QB.createSession(params,async function(err, result) {
    //   const chatConnectParams = {
    //     userId: resp.userChatID,
    //     password: resp.userPassword
    //   };
    //   QB.chat.connect(chatConnectParams, async function(error, contactList) {
    //     if(error){
    //       console.log('error:'+JSON.stringify(error))
    //     }
    //     else{

    //         // var message = {
    //         //   type: "chat",
    //         //   body: "How are you today Ishaan?",
    //         //   extension: {
    //         //     save_to_history: 1,
    //         //     dialog_id: resp.dialogID
    //         //   },
    //         //   markable: 1
    //         // };

    //         // var opponentId = resp.partnerChatID;
    //         // //resp.partnerChatID;
    //         // try {
    //         //   message.id = QB.chat.send(opponentId, message);
    //         // } catch (e) {
    //         //   if (e.name === 'ChatNotConnectedError') {
    //         //     // not connected to chat
    //         //     console.log('errorname:'+JSON.stringify(e))
    //         //   }
    //         //   console.log('IShaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaannnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn')
    //         //   console.log('error:'+JSON.stringify(e))
    //         // }
    //         QB.chat.onMessageListener =  onMessage; 
    //       }
    //     });
    //   });
    return res.status(200).send({resp});
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

async function quickbloxRegistration(UserId) {
  var pwd = generator.generate({
    length: 10,
    numbers: true
  });
  
 var params = { login: "103641649381386550513_12855", password: "Tamely123" };
QB.createSession(params,function(err, result) {
  // let pwd= await genpwd();
   params = {
    login: UserId.toString(),
    password: pwd
  };
  
  QB.users.create(params,async function(error, result) {
    if (error) {
      console.log("Create user error: " + JSON.stringify(error));
    } else {
      console.log("Result " + JSON.stringify(result));
      payload={
        userLogin:UserId.toString(),
        userPassword:pwd,
        userChatID:result.id 
      }
      let QuickbloxSchema = new Quickblox(payload);
      let resp = await QuickbloxSchema.save();
      return result;
    }
  });          
});
}

function onMessage(userId, message) {
  console.log('message:'+JSON.stringify(message))
  console.log('userId:'+JSON.stringify(userId))

//   var message = {
//     type: "chat",
//     body: "How are you today Ishaan?",
//     extension: {
//       save_to_history: 1,
//       dialog_id: resp.dialogID
//     },
//     markable: 1
//   };

// var opponentId = userId
// //resp.partnerChatID;
// try {
//   message.id = QB.chat.send(opponentId, message);
// } catch (e) {
//   if (e.name === 'ChatNotConnectedError') {
//     // not connected to chat
//     console.log('errorname:'+JSON.stringify(e))
//   }
//   console.log('IShaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaannnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn')
//   console.log('error:'+JSON.stringify(e))
// }


} 
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
    lat : Schema.Types.Decimal128,
    long : Schema.Types.Decimal128,
  },
  location: {
    type : {type : String},
    coordinates : [],
  },
  phone: String,
  alternatePhone: String,
  alternateName: String,
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
  start: Date,
  dayOff: [],
  runDetails:[
   {
      runTime1:String,
      runTime2:String,
      runDate:String,
      run2Status:{
        type: Number,
        default: 0,
      },
      run1Status:{
        type: Number,
        default: 0,
      },
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
    amount: Number,
    status: {
      type: Number,
      default: 0,
      // 0 for failed
      // 1 for successful transaction
    },
  },
  bookingStatus: {
    type: String,
    default: "Dog Runner will be assigned shortly",
    enum: ["Dog Runner will be assigned shortly", "Completed"],
  },
  User: {
    type: Schema.ObjectId,
    ref: "User",
  },
  status:{
    type: Number,
    default: 0,
  },
  paymentStatus:{
    type:Number,
    default:0
  },
  isReorderDone:{
    type : Boolean,
    default : false
  }
},
{
  timestamps: true
});

const decimal2JSON = (v, i, prev) => {
  if (v !== null && typeof v === 'object') {
    if (v.constructor.name === 'Decimal128')
      prev[i] = v.toString();
    else
      Object.entries(v).forEach(([key, value]) => decimal2JSON(value, key, prev ? prev[i] : v));
  }
};

bookingDetailsSchema.set('toJSON', {
  transform: (doc, ret) => {
    decimal2JSON(ret);
    return ret;
  }
});

const bookingDetails = mongoose.model("bookingDetails", bookingDetailsSchema);

module.exports.bookingDetails = bookingDetails;



const DogTrainingbookingDetailsSchema = new Schema({
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
  petRunningLocation: {
    addressLine1: String,
    addressLine2: String,
    state: String,
    city: String,
    pinCode: String,
    lat : Schema.Types.Decimal128,
    long : Schema.Types.Decimal128,
  },
  location: {
    type : {type : String},
    coordinates : [],
  },
  //to be added below code
  // location:{
  //   type: {
  //     type: String, // Don't do `{ location: { type: String } }`
  //     enum: ['Point'], // 'location.type' must be 'Point'
  //     required: false
  //   },
  //   coordinates: {
  //     type: [Number],
  //     required: false
  //   }
  // },
  // latitude:{type: Number, required:true},
  // longitude:{type: Number, required:true},
  phone: String,
  package: {
    description: String,
    amount: Number,
    frequency: {
      type: Number,
    },
  },
  startDate: String,
  start: Date,
  time:String,
  runDetails:[
   {
      sessionNo:Number,
      runDate:String,
      sessionStatus:{
        type: Number,
        default: 0,
      },
      sessionReport: {
        type: Schema.ObjectId,
        ref: "ServiceAppointment",
      }
    }
  ],
  paymentDetails: {
    transactionId: String,
    amount: Number,
    status: {
      type: Number,
      default: 0,
      // 0 for failed
      // 1 for successful transaction
    },
  },
  bookingStatus: {
    type: String,
    default: "Dog Trainer will be assigned shortly",
    enum: ["Dog Trainer will be assigned shortly", "Completed"],
  },
  User: {
    type: Schema.ObjectId,
    ref: "User",
  },
  status:{
    type: Number,
    default: 0,
  },
  paymentStatus:{
    type:Number,
    default:0
  }
},
{
  timestamps: true
});
const DogTrainingbookingDetails = mongoose.model("DogTrainingbookingDetails", DogTrainingbookingDetailsSchema);
module.exports.DogTrainingbookingDetails = DogTrainingbookingDetails;

// const decimal2JSON = (v, i, prev) => {
//   if (v !== null && typeof v === 'object') {
//     if (v.constructor.name === 'Decimal128')
//       prev[i] = v.toString();
//     else
//       Object.entries(v).forEach(([key, value]) => decimal2JSON(value, key, prev ? prev[i] : v));
//   }
// };

// DogTrainingbookingDetailsSchema.set('toJSON', {
//   transform: (doc, ret) => {
//     decimal2JSON(ret);
//     return ret;
//   }
// });


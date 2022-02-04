const mongoose = require("mongoose");
const validator = require("validator");
const Schema = mongoose.Schema;
const RequestError = require("../errorTypes/RequestError");

const AnimalSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    minlength: 3,
  },
  bookmarks: [
    {
      post: {
        type: Schema.ObjectId,
        ref: "Post",
      },
    },
  ],
  avatar: String,
  guardians: [
    {
      user: {
        type: Schema.ObjectId,
        ref: "User",
      },
      confirmed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  relatedAnimals: [
    {
      relation: String,
      confirmed: {
        type: Boolean,
        default: false,
      },
      animal: {
        type: Schema.ObjectId,
        ref: "Animal",
      },
      status: Number //  0 , 1 , -1 
      // 0 means outgoing, 1 means incoming and -1 means relation has been accepted
    },
  ],
  //TODO: make a different schema of category
  category: {
    type: String,
    default : 'Pet'
  },
  bio: {
    type: String,
    maxlength: 130,
  },
  animalType: {
    type: String,
  },
  gender: String,
  breed: String,
  age: String,
  mating: {
    type: Boolean,
    default: false,
  },
  adoption: {
    type: Boolean,
    default: false,
  },
  playBuddies: {
    type: Boolean,
    default: false,
  },
  playFrom: String,
  playTo: String,
  servicePet: Boolean,
  spayed: Boolean,
  friendlinessWithHumans: Number,
  friendlinessWithAnimals: Number,
  favouriteThings: {
    type: String,
    maxlength: 130,
  },
  thingsDislikes: {
    type: String,
    maxlength: 130,
  },
  uniqueHabits: {
    type: String,
    maxlength: 130,
  },
  eatingHabits: {
    type: String,
    maxlength: 130,
  },
  location: {
    type : {type : String},
    coordinates : [],
  },
  registeredWithKennelClub:Boolean,
  isBrandAmbassador : {
    type : Boolean,
    default : false,
  }
},
{
  timestamps: true
});

AnimalSchema.index({ location: "2dsphere" });

AnimalSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const document = await Animal.findOne({ username: this.username });
      if (document)
        return next(
          new RequestError("An animal with that username already exists.", 400)
        );
      //TODO : change the followers and following schema to {animal_id, follower_id}
      // await mongoose.model('Followers').create({ animal: this._id });
      // await mongoose.model('Following').create({ animal: this._id });
    } catch (err) {
      return next((err.statusCode = 400));
    }
  }
});

const Animal = mongoose.model("Animal", AnimalSchema);
module.exports = Animal;

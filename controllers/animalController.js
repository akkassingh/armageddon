const Animal = require("../models/Animal");
const User = require("../models/User");
const Post = require("../models/Post");
const Followers = require("../models/Followers");
const Following = require("../models/Following");
const ObjectId = require("mongoose").Types.ObjectId;
const logger = require("../logger/logger");
const bcrypt = require("bcrypt");
const jwt = require("jwt-simple");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports.registerPet = async (req, res, next) => {
  const user = res.locals.user;
  const {
    name,
    username,
    category,
    bio,
    animalType,
    gender,
    breed,
    age,
    mating,
    adoption,
    playBuddies,
    playFrom,
    playTo,
    servicePet,
    spayed,
    friendlinessWithHumans,
    friendlinessWithAnimals,
    favouriteThings,
    thingsDislikes,
    uniqueHabits,
    eatingHabits,
    location,
    registeredWithKennelClub,
  } = req.body;
  try {
    let fileArr = [];
    for (let fl of req.files) {
      const response = await cloudinary.uploader.upload(fl.path);
      fileArr.push(response.secure_url);
      fs.unlinkSync(fl.path);
    }

    const animal = new Animal({
      name,
      username,
      avatar: fileArr[0],
      category,
      bio,
      animalType,
      gender,
      breed,
      age,
      mating,
      adoption,
      playBuddies,
      playFrom,
      playTo,
      servicePet,
      spayed,
      friendlinessWithHumans,
      friendlinessWithAnimals,
      favouriteThings,
      thingsDislikes,
      uniqueHabits,
      eatingHabits,
      location,
      registeredWithKennelClub,
    });
    animal.guardians.push({
      user: user._id,
      confirmed: true,
    });
    let pet = await animal.save();
    const petObject = {
      pet: animal._id,
      confirmed: true,
    };
    await User.findByIdAndUpdate(
      { _id: user._id },
      { $push: { pets: petObject } }
    );

    return res.status(201).json({
      pet,
      token: jwt.encode({ id: animal._id }, process.env.JWT_SECRET),
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.editPet = async (req, res, next) => {
  const user = res.locals.user;
  const {
    animalId,
    name,
    username,
    category,
    bio,
    animalType,
    gender,
    breed,
    age,
    mating,
    adoption,
    playBuddies,
    playFrom,
    playTo,
    servicePet,
    spayed,
    friendlinessWithHumans,
    friendlinessWithAnimals,
    favouriteThings,
    thingsDislikes,
    uniqueHabits,
    eatingHabits,
    location,
    registeredWithKennelClub,
  } = req.body;
  try {
    let fileArr = [];
    for (let fl of req.files) {
      const response = await cloudinary.uploader.upload(fl.path);
      fileArr.push(response.secure_url);
      fs.unlinkSync(fl.path);
    }

    let animalObj = {
      name,
      avatar: fileArr.length > 0 ? fileArr[0] : req.body.avatar,
      category,
      bio,
      animalType,
      gender,
      breed,
      age,
      mating,
      adoption,
      playBuddies,
      playFrom,
      playTo,
      servicePet,
      spayed,
      friendlinessWithHumans,
      friendlinessWithAnimals,
      favouriteThings,
      thingsDislikes,
      uniqueHabits,
      eatingHabits,
      location,
      registeredWithKennelClub,
      guardians: {
        user: user._id,
        confirmed: true,
      },
    };
    const animal = await Animal.findByIdAndUpdate(
      { _id: ObjectId(animalId) },
      animalObj
    );

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// module.exports.editPet = async (req, res, next) => {
//   const user = res.locals.user;
//   const {
//     // servicePet,
//     // spayed,
//     friendlinessWithHumans,
//     friendlinessWithAnimals,
//     favouriteThings,
//     thingsDislikes,
//     uniqueHabits,
//     eatingHabits,
//   } = req.body;
//   try {
//     let pet=await Animal.findById({_id:req.body.petId});
//     // if(req.body.friendlinessWithAnimals!==null )
//     // console.log(pet.friendlinessWithAnimals)
//     // pet.servicePet=servicePet!==null ? servicePet : pet.servicePet
//     // pet.spayed=spayed!==null ? spayed : pet.spayed
//     pet.friendlinessWithHumans=friendlinessWithHumans!==null ? friendlinessWithHumans : pet.friendlinessWithHumans
//     pet.friendlinessWithAnimals= req.body.friendlinessWithAnimals!==null ? friendlinessWithAnimals : pet.friendlinessWithAnimals
//     pet.favouriteThings=favouriteThings!==null ? favouriteThings : pet.favouriteThings
//     pet.thingsDislikes=thingsDislikes!==null ? thingsDislikes : pet.thingsDislikes
//     pet.uniqueHabits=uniqueHabits!==null ? uniqueHabits : pet.uniqueHabits
//     pet.eatingHabits=eatingHabits!==null ? eatingHabits : pet.eatingHabits

//     await Animal.updateOne({_id:pet._id},{
//       friendlinessWithHumans: pet.friendlinessWithHumans,
//       friendlinessWithAnimals:pet.friendlinessWithAnimals,
//       favouriteThings:pet.favouriteThings,
//       thingsDislikes:pet.thingsDislikes,
//       uniqueHabits:pet.uniqueHabits,
//       eatingHabits:pet.eatingHabits,
//     })
//     return res.status(201).json({
//       pet
//     });
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

module.exports.addGuardian = async (req, res, next) => {
  const animal = res.locals.animal;
  const { idUser } = req.body;
  try {
    const user = await User.findById(idUser);
    if (!user)
      return res.status(404).send({ error: "No such pet or user exists!" });
    const found = animal.guardians.findIndex(function (ele, index) {
      if (ele.user == idUser) return true;
    });
    if (found != -1) {
      if (animal.guardians[found].confirmed) {
        return res.status(403).send({
          error: `${user.fullName} is already guardian of ${animal.name}!`,
        });
      } else {
        return res.status(403).send({
          error: `Request already sent to ${user.fullName} to become guardian of ${animal.name}`,
        });
      }
    }
    const userObject = {
      user: user._id,
      confirmed: false,
    };
    const petObject = {
      pet: animal._id,
      confirmed: false,
    };
    await User.updateOne({ _id: user._id }, { $push: { pets: petObject } });
    await Animal.updateOne(
      { _id: animal._id },
      { $push: { guardians: userObject } }
    );
    return res.status(201).send({
      message: `Hurray! Now, ${user.fullName} is the guardian of ${animal.name}!`,
    });
  } catch (err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
};

module.exports.addRelatedAnimals = async (req, res, next) => {
  const animal = res.locals.animal;
  const { idRelatedAnimal, relation } = req.body;
  try {
    const relatedAnimal = await Animal.findById(idRelatedAnimal);
    if (!relatedAnimal) {
      return res.status(404).send({ error: "Invalid animal!" });
    }
    const found = animal.relatedAnimals.findIndex(function (ele, index) {
      if (ele.animal == idRelatedAnimal) return true;
    });
    if (found != -1) {
      if (animal.relatedAnimals[found].confirmed) {
        return res.status(403).send({
          error: `${animal.name} is already your ${pet.relatedAnimals[found].relation}!`,
        });
      } else {
        return res.status(403).send({
          error: `You have already requested ${animal.name} to be your ${pet.relatedAnimals[found].relation}!`,
        });
      }
    }
    const oppRelation =
      relation === "Sibling" || relation === "Friend" ? relation : "Child";
    const objAnimal = {
      relation: relation,
      confirmed: false,
      animal: animal._id,
    };
    const objRelatedAnimal = {
      relation: oppRelation,
      confirmed: false,
      animal: pet._id,
    };
    await Animal.updateOne(
      { _id: animal._id },
      { $push: { relatedAnimals: objAnimal } }
    );
    await Animal.updateOne(
      { _id: relatedAnimal._id },
      { $push: { relatedAnimals: objRelatedAnimal } }
    );
    return res
      .status(201)
      .json({ message: "Your request has been sent successfully!" });
  } catch (err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
};

module.exports.confirmRelation = async (req, res, next) => {
  const animal = res.locals.animal;
  const { idRelatedAnimal } = req.body;
  try {
    const relatedAnimal = await Animal.findById(idRelatedAnimal);
    if (!relatedAnimal)
      return res.status(404).send({ error: "Invalid animal!" });
    const found = animal.relatedAnimals.findIndex(function (ele, index) {
      if (ele.animal == idRelatedAnimal) return true;
    });
    const foundRelated = relatedAnimal.relatedAnimals.findIndex(function (
      ele,
      index
    ) {
      if (ele.animal == animal._id) return true;
    });
    if (found == -1 || foundRelated == -1) {
      return res
        .status(404)
        .send({ error: `There is no request from ${relatedAnimal.name}` });
    }
    const objId = animal.relatedAnimals[found]._id;
    const relatedId = relatedAnimals[foundRelated]._id;
    await Animal.updateOne(
      { "relatedAnimals._id": objId },
      {
        $set: {
          "relatedAnimals.$.confirmed": true,
        },
      }
    );
    await Animal.updateOne(
      { "relatedAnimals._id": newId },
      {
        $set: {
          "relatedAnimals.$.confirmed": true,
        },
      }
    );
  } catch (err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
};

module.exports.getPetDetails = async (req, res, next) => {
  try {
    const animal = await Animal.findById(req.body.petId);
    if (!animal) return res.status(404).send({ error: "No such pet exists!" });

    return res.status(201).send({ pet: animal });
  } catch (err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
};

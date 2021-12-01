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
    let fileArr = null;
    if (req.files){
      fileArr = [];
    for (let fl of req.files) {
      const response = await cloudinary.uploader.upload(fl.path);
      fileArr.push(response.secure_url);
      fs.unlinkSync(fl.path);
    }
  }

    const animal = new Animal({
      name,
      username,
      avatar: (fileArr == null) ? null : fileArr[0],
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


module.exports.editPetHabits = async (req, res, next) => {
  const user = res.locals.user;

  const {
    // servicePet,
    // spayed,
    friendlinessWithHumans,
    friendlinessWithAnimals,
    favouriteThings,
    thingsDislikes,
    uniqueHabits,
    eatingHabits,
  } = req.body;
  try {
    let pet=await Animal.findById({_id:req.body.petId});
    // if(req.body.friendlinessWithAnimals!==null )
    // console.log(pet.friendlinessWithAnimals)
    // pet.servicePet=servicePet!==null ? servicePet : pet.servicePet
    // pet.spayed=spayed!==null ? spayed : pet.spayed
    pet.friendlinessWithHumans=friendlinessWithHumans!=0 ? friendlinessWithHumans : pet.friendlinessWithHumans
    pet.friendlinessWithAnimals= req.body.friendlinessWithAnimals!=0 ? friendlinessWithAnimals : pet.friendlinessWithAnimals
    pet.favouriteThings=favouriteThings!=0 ? favouriteThings : pet.favouriteThings
    pet.thingsDislikes=thingsDislikes!=0 ? thingsDislikes : pet.thingsDislikes
    pet.uniqueHabits=uniqueHabits!=0 ? uniqueHabits : pet.uniqueHabits
    pet.eatingHabits=eatingHabits!=0 ? eatingHabits : pet.eatingHabits

    await Animal.updateOne({_id:pet._id},{
      friendlinessWithHumans: pet.friendlinessWithHumans,
      friendlinessWithAnimals:pet.friendlinessWithAnimals,
      favouriteThings:pet.favouriteThings,
      thingsDislikes:pet.thingsDislikes,
      uniqueHabits:pet.uniqueHabits,
      eatingHabits:pet.eatingHabits,
    })
    return res.status(201).json({
      pet
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

  const { idUser, idAnimal } = req.body;
  const animal = await Animal.findById(idAnimal);
  const user = await User.findById(idUser);
  if (!animal || !user) {
    return res.setatus(404).send({"error" : "Invalid Request!"})
  }
  try {
    const found = animal.guardians.findIndex(function (ele, index) {
      if (ele.user == idUser) return true;
    });
    if (found != -1) {
      const request = animal.guardians[found].confirmed;
      if (animal.guardians[found].confirmed) {
        return res.status(403).send({
          error: `${user.fullName} is already guardian of ${animal.name}!`,
        });
      } 
      else {
        return res.status(200).send({"message": "Request already sent!"})
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
      { $push : {guardians: userObject} }
    );
    return res.status(201).send({message: "Your request has been sent successfully!"});
  } catch (err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
};

module.exports.addRelatedAnimals = async (req, res, next) => {
  const { idRelatedAnimal, relation, animalId } = req.body;
  if (!idRelatedAnimal || !relation || !animalId){
    return res.status(400).send({error: "Invalid Request!"});
  }
  if (idRelatedAnimal == animalId){
    return res.status(400).send({error: "Please select a different animal!"});
  }
  try {
    const animal = await Animal.findById(animalId, 'relatedAnimals');
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
          error: `${relatedAnimal.name} is already your ${animal.relatedAnimals[found].relation}!`,
        });
      } else {
        return res.status(403).send({
          error: `You have already requested ${relatedAnimal.name} to be your ${animal.relatedAnimals[found].relation}!`,
        });
      }
    }
    const oppRelation =
      relation === "Sibling" || relation === "Friend" ? relation : "Child";
    const objAnimal = {
      relation: relation,
      confirmed: false,
      animal: relatedAnimal._id,
      status: 0
    };
    const objRelatedAnimal = {
      relation: oppRelation,
      confirmed: false,
      animal: animal._id,
      status: 1
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
  const { idRelatedAnimal, animalId } = req.body;
  try {
    const animal = await Animal.findById(animalId, 'relatedAnimals');
    console.log(animal);
    const relatedAnimal = await Animal.findById(idRelatedAnimal, 'relatedAnimals');
    console.log(relatedAnimal)
    if (!relatedAnimal || !animal)
      return res.status(404).send({ error: "Invalid animal!" });
    const found = animal.relatedAnimals.findIndex(function (ele, index) {
      if (ele.animal == idRelatedAnimal) return true;
    });
    console.log(found)
    const foundRelated = relatedAnimal.relatedAnimals.findIndex(function (
      ele,
      index
    ) {
      if (ele.animal == animalId) return true;
    });
    console.log(foundRelated)
    if (found == -1 || foundRelated == -1) {
      return res
        .status(404)
        .send({ error: `There is no request from ${relatedAnimal.name}` });
    }
    if (animal.relatedAnimals[found].confirmed) {
      return res.status(200).send({"message" : "Request has been already accepted!"})
    }
    if (animal.relatedAnimals[found].status == -1 || animal.relatedAnimals[found] == 0) {
      return res.status(400).send({error: "Invalid Request!"})
    }
    const objId = animal.relatedAnimals[found]._id;
    const relatedId = relatedAnimal.relatedAnimals[foundRelated]._id;
    await Animal.updateOne(
      { "relatedAnimals._id": objId },
      {
        $set: {
          "relatedAnimals.$.confirmed": true,
          "relatedAnimals.$.status" : -1,
        },
      }
    );
    await Animal.updateOne(
      { "relatedAnimals._id": relatedId },
      {
        $set: {
          "relatedAnimals.$.confirmed": true,
          "relatedAnimals.$.status" : -1,
        },
      }
    );
    return res.status(201).send({"message" : "Request Accepted Successfully!"});
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

module.exports.getGuardians = async (req, res, next) => {
  try {
    const guardians = await Animal.findOne({_id: req.body.animalId}, {guardians: 1, _id: 0}).populate('guardians.user', 'username email avatar confirmed');
    if (!guardians) return res.status(404).send({ error: "No such pet exists!" });
    return res.status(201).send(guardians);
  }
  catch(err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
}

module.exports.getRelations = async (req, res, next) => {
  const {animalId} = req.body;
  if (!animalId) {
    return res.status(400).send({"error": "Invalid Request!"})
  }
  try {
    const animal = await Animal.findById(animalId, 'relatedAnimals');
    if (!animal) {
      return res.status(404).send({"error" : "Fuck off!"});
    }
    var relations = animal.relatedAnimals.filter(function(check)
    {
      return check.confirmed == true;
    });
    return res.status(200).send({"relatives":relations});
  }
  catch (err){
    console.log(err);
    next(err);
  }
};

module.exports.getRelationRequests = async (req, res, next) => {
  const {animalId, type} = req.body;
  // type will be of 2 types, either incoming or outgoing
  if (!animalId || !type || (type != "incoming" && type != "outgoing")) {
    return res.status(404).send({"error": "Invalid Request!"});
  }
  try{
    const requests = await Animal.findById(animalId, 'relatedAnimals').populate('relatedAnimals.animal', 'name username avatar _id');
    if (!requests){
      return res.status(400).send({error: "Invalid Request!"});
    }
    const val = (type == "incoming") ? 1 : 0; 
    const result = requests.relatedAnimals.filter(function(ele){
      return ele.status == val;
    })
    return res.status(200).send({"pendingIncomingRequests": result});
  }
  catch(err){
    console.log(err);
    next(err);
  }
};
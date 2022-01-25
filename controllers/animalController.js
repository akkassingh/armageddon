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
const dogNames = require('dog-names');
const {notifyUser, notifyAnimal, formatCloudinaryUrl} = require("../utils/controllerUtils");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});




// QB.createSession(params, function(error, result) {
//   if (error) {
//     console.log('Something went wrong: ' + JSON.stringify(error));
// } else {
//     console.log('Session created with id ' + result);
// }});


// var params = {
//   login: "user1",
//   password: "someSecret"
// };

// QB.users.create(params, function(error, result) {
//   if (error) {
//     console.log("Create user error: " + JSON.stringify(error));
//   } else {
//     console.log("Result " + JSON.stringify(result));

//   }
// });
module.exports.registerPet = async (req, res, next) => {
  const user = res.locals.user;
  const {
    name,
    avatar,
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
    // let fileArr = null;
  //   if (req.files){
  //     fileArr = [];
  //   for (let fl of req.files) {
  //     const response = await cloudinary.uploader.upload(fl.path);
  //     fileArr.push(response.secure_url);
  //     fs.unlinkSync(fl.path);
  //   }
  // }

    const animal = new Animal({
      name,
      username,
      avatar,
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
  let user = null;
  if (req.headers.type=="User")
    user = res.locals.user
  else
    user = res.locals.animal
  const {
    animalId,
    name,
    username,
    avatar,
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
    location,
    registeredWithKennelClub,
  } = req.body;
  try {
    // let fileArr = [];
    // for (let fl of req.files) {
    //   const response = await cloudinary.uploader.upload(fl.path);
    //   fileArr.push(response.secure_url);
    //   fs.unlinkSync(fl.path);
    // }
    // avatar: fileArr.length > 0 ? fileArr[0] : req.body.avatar,
    // const animal = await Animal.findById(animalId,'guardians')
    // let animalObj = {
    //   name,
    //   username,      
    //   avatar,
    //   category,
    //   bio,
    //   animalType,
    //   gender,
    //   breed,
    //   age,
    //   mating,
    //   adoption,
    //   playBuddies,
    //   playFrom,
    //   playTo,
    //   servicePet,
    //   spayed,
    //   location,
    //   registeredWithKennelClub,
    // };
    await Animal.updateOne(
      { _id: ObjectId(animalId) },
      {...req.body}
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
    const n_obj = {
      body : `${animal.username} has requested you to become the Guardian!`,
      image : formatCloudinaryUrl(
        animal.avatar,
        { height: 720, width: 1440, x: '100%', y: '100%', notify: true },
        true
      ),
    }
    notifyUser(n_obj,'tamelyid',idUser);
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
    const animal = await Animal.findById(animalId, 'relatedAnimals username avatar');
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
    const n_obj = {
      body : `${animal.username} requested to be ${relatedAnimal.username}'s ${oppRelation}!`,
      image : formatCloudinaryUrl(
        animal.avatar,
        { height: 720, width: 1440, x: '100%', y: '100%', notify : true },
        true
      ),
    }
    notifyAnimal(n_obj,'tamelyid',idRelatedAnimal);
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
    const animal = await Animal.findById(animalId, 'relatedAnimals username avatar');
    console.log(animal);
    const relatedAnimal = await Animal.findById(idRelatedAnimal, 'relatedAnimals username');
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
    const n_obj = {
      body : `${animal.username} accepted ${relatedAnimal.username}'s relation request!`,
      image : formatCloudinaryUrl(
        animal.avatar,
        { height: 720, width: 1440, x: '100%', y: '100%', notify : true },
        true
      ),
    };
    notifyAnima(n_obj,'tamelyid',idRelatedAnimal);
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
    const guardians = await Animal.findOne({_id: req.body.animalId}, {guardians: 1, _id: 0}).populate('guardians.user', 'username email avatar');
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
    const animal = await Animal.findById(animalId, 'relatedAnimals').populate('relatedAnimals.animal', 'username name avatar');
    if (!animal) {
      return res.status(404).send({"error" : "Invalid request!"});
    }
    // var relations = animal.relatedAnimals.filter(function(check)
    // {
    //   return check.confirmed == true;
    // });
    var relations = animal.relatedAnimals;
    return res.status(200).send({"relatives":relations});
  }
  catch (err){
    console.log(err);
    next(err);
  }
};

module.exports.rejectRelation = async (req, res, next) => {
  const {animalId, id} = req.body;
  let user = null;
  user = await Animal.findById(id, '_id relatedAnimals');
  const relation = user.relatedAnimals;
  let idx = -1;
  let confirmed = undefined;
  // we are looking in user now
  for (var i=0;i<relation.length;i++){
    if (relation[i].animal.toString() == animalId.toString()){
      idx = i;
      confirmed = relation[i].confirmed;
    }
  }
  if (idx == -1){
    return res.status(404).send({"message" : "No relation found between the two animals", "success" : false});
  }
  if (confirmed){
    return res.status(400).send({"message" : "Invalid Request!", "success" : false});
  }
  var newRelationSelf = relation.filter(function (ele){
    return ele.animal.toString() != animalId.toString()
  })
  console.log('Self Related_Animals', newRelationSelf);
  //we are looking in other animal now
  let relationAnimal = await Animal.findById(animalId, 'relatedAnimals');
  let animalRelations = relationAnimal.relatedAnimals;
  idx = -1;
  confirmed = undefined;
  for (var i=0; i<animalRelations.length;i++){
    if (animalRelations[i].animal.toString() == user._id.toString()){
      idx = i;
      confirmed = animalRelations[i].confirmed;
    }
  }
  if (idx == -1){
    return res.status(404).send({"message" : "No relation found between the two animals", "success" : false});
  }
  if (confirmed){
    return res.status(400).send({"message" : "Invalid Request!", "success" : false});
  }
  var newRelationsAnimal = animalRelations.filter(function (ele){
    return ele.animal.toString() != user._id.toString()
  })
  console.log('Opposite Related_Animals', newRelationsAnimal);

  await Animal.updateOne({_id : user._id},{relatedAnimals : newRelationSelf});
  await Animal.updateOne({_id : animalId}, {relatedAnimals : newRelationsAnimal});
  return res.status(200).send({"message" : "Request Declined successfully!", "success" : true});

}

module.exports.rejectGuardian = async (req, res, next) => {
  const {animalId} = req.body;
  let user = null;
  if (req.headers.type=="User"){
    user = res.locals.user
  }
  if (!user){
    return res.status(403).send({"message" : "Not authorized!", "success" : false})
  }
  try{
    const animal = await Animal.findById(animalId, 'guardians');
    if (!animal){
      return res.status(400).send({"message" : "Invalid Request!"})
    }
    const guardians = animal.guardians;
    let idx = -1;
    let confirmed = null;
    for (var i=0; i<guardians.length;i++){
      if (guardians[i].user.toString() == user._id.toString()){
        idx = i;
        confirmed = guardians[i].confirmed;
      }
    }
    if (idx == -1){
      return res.status(404).send({"message" : "No pet found!", "success" : false});
    }
    if (confirmed){
      return res.status(400).send({"message" : "Already a pet!", "success" : false});
    }
    idx = -1;
    confirmed = null;
    const pets = user.pets;
    for (var i=0;i<pets.length;i++){
      if (pets[i].pet.toString() == animalId){
        idx = i;
        confirmed = pets[i].confirmed;
      }
    }
    if (idx == -1){
      return res.status(404).send({"message" : "No pet found!", "success" : false});
    }
    if (confirmed){
      return res.status(400).send({"message" : "Already a pet!", "success" : false});
    }
    const newPets = pets.filter(function (ele){
      return ele.pet.toString() != animalId
    })
    const newGuardian = guardians.filter(function (ele){
      return ele.user.toString() != user._id.toString()
    })
    await User.updateOne({id : user._id}, {pets : newPets});
    await Animal.updateOne({id : animalId}, {guardians : newGuardian});
    return res.status(201).send({"message" : "Request rejected successfully!", "success" : true});
  }
  catch (err){
    console.log(err)
    next(err)
  }
}

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

module.exports.getUniquePetName = async (req, res, next) => {
  let uniqueUsername = undefined;
  try {
    while (!uniqueUsername) {
      const username = dogNames.allRandom() + Math.floor(Math.random(1000) * 9999 + 1);
      const user = await Animal.findOne({username},'_id');
      if (!user) {
        uniqueUsername = username;
      }
    }
    return res.status(200).send({"username" :uniqueUsername});
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports.editPetMainDetails = async (req, res, next) => {
  const {petId, username, fullName, bio, avatar} = req.body;
  const user = res.locals.user;
  let found = false;
  for (var i=0; i<user.pets.length;i++){
    if (user.pets[i].pet == petId){
      found = true;
    }
  }
  if (!found){
    return res.status(401).send({error: "You are not authorized!"})
  }
  try {
    let animal = await Animal.findById(petId, '_id');
    if (!animal) return res.status(404).send({ error: "No such pet exists!" });
    await Animal.updateOne(
      { _id : petId},
      {
        ...req.body
      }
    )
    return res.status(200).send({success: true});
  }
  catch (err) {
    console.log(err);
  }
}

module.exports.confirmGuardian = async (req, res, next) => {
  const {animalId} = req.body;
  const user = res.locals.user;
  if (!user)
  {
    return res.status(400).send({"message" : "Invalid user!", "success" : false});
  }
  try{
    const animal = await Animal.findById(animalId, 'guardians username');
    if (!animal){
      return res.status(404).send({"message" : "Pet does not exist!", "success" : false});
    }
    const guardians = animal.guardians;
    const pets = user.pets;
    let found  = false; let found_g = false;
    let confirmed = null; let confirmed_g = null;
    let idx = -1; let idx_g = -1;
    for (var i=0;i<guardians.length;i++){
      if (guardians[i].user.toString() == user._id.toString()){
        found_g = true;
        confirmed_g = guardians[i].confirmed;
        idx_g = i;
      }
    }
    for (var i=0;i<pets.length;i++){
      if (pets[i].pet.toString() == animalId){
        found = true;
        confirmed = pets[i].confirmed;
        idx = i;
      }
    }
    if (!found || !found_g){
      return res.status(404).send({"message" : "No pet request exist!", "success" : false});
    }
    if (confirmed || confirmed_g){
      return res.status(200).send({"message" : "You are already a guardian of your pet!", "success" : false});
    }
    pets[idx].confirmed = true;
    guardians[idx_g].confirmed = true;
    await User.updateOne({ _id: user._id}, {pets : pets});
    await Animal.updateOne({_id : animalId},{guardians: guardians});
    const n_obj = {
      body : `${user.username} accepted the request to be ${animal.username}'s guardian!`,
      image : formatCloudinaryUrl(
        user.avatar,
        { height: 720, width: 1440, x: '100%', y: '100%', notify : true },
        true
      ),
    }
    notifyAnimal(n_obj,'tamelyid',animalId);
    return res.status(201).send({"message" : "Request Accepted!", "success" : true});
  }
  catch (err){
    console.log(err);
    next(err);
  }
}

module.exports.setAmbassador = async (req, res, next) => {
  try{
    const token = jwt.encode({id : req.body.id},process.env.JWT_SECRET);
    res.send(token);
  }
  catch (err){
    console.log(err)
  }
}
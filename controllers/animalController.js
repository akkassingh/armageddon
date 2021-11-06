const Animal = require('../models/Animal');
const User = require('../models/User');
const Post = require('../models/Post');
const Followers = require('../models/Followers');
const Following = require('../models/Following');
const ObjectId = require('mongoose').Types.ObjectId;
const logger = require('../logger/logger');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');

module.exports.registerPet = async (req, res, next) => {
    const user = res.locals.user;
    const {name, username, avatar,category, bio, animalType, gender, breed, age, 
    mating, adoption, playBuddies, playFrom, playTo, servicePet, spayed, 
    friendlinessWithHumans, friendlinessWithAnimals, favouriteThings, thingsDislikes, 
    uniqueHabits, eatingHabits, location} = req.body;   
    try {
        const animal = new Animal({name, username, avatar,category, bio, animalType, gender, breed, age, 
          mating, adoption, playBuddies, playFrom, playTo, servicePet, spayed, 
          friendlinessWithHumans, friendlinessWithAnimals, favouriteThings, thingsDislikes, 
          uniqueHabits, eatingHabits, location});
        animal.guardians.push({
          user: user._id,
          confirmed: true,
        })
        await animal.save();
        return res.status(201).json({pet, token: jwt.encode({ id: animal._id }, process.env.JWT_SECRET)});
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports.addGuardian = async (req, res, next) => {
    const animal = res.locals.animal;
    const {idUser} = req.body;
    try{

      const user = await User.findById(idUser);
      if (!user) return res.status(404).send({error: 'No such pet or user exists!'});
      const found = animal.guardians.findIndex(function(ele,index) {
        if (ele.user == idUser) return true;
      })
      if (found!=-1) {
        if (animal.guardians[found].confirmed) {
          return res.status(403).send({error: `${user.fullName} is already guardian of ${animal.name}!`})
        }
        else {
          return res.status(403).send({error: `Request already sent to ${user.fullName} to become guardian of ${animal.name}`});
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
      await User.updateOne({_id: user._id}, {$push: {pets: petObject}});
      await Animal.updateOne({_id: animal._id}, {$push: {guardians: userObject}});
      return res.status(201).send({message: `Hurray! Now, ${user.fullName} is the guardian of ${animal.name}!`})
    }
    catch (err){
      logger.info(err);
      console.log(err);
      next(err);
    }
};

module.exports.addRelatedAnimals = async(req, res, next) => {
  const animal = res.locals.animal;
  const {idRelatedAnimal, relation} = req.body;
  try {
    const relatedAnimal = await Animal.findById(idRelatedAnimal);
    if (!relatedAnimal) {
      return res.status(404).send({error: 'Invalid animal!'})
    }
    const found = animal.relatedAnimals.findIndex(function(ele,index) {
      if (ele.animal == idRelatedAnimal) return true;
    })
    if (found!=-1) {
      if (animal.relatedAnimals[found].confirmed) {
        return res.status(403).send({error: `${animal.name} is already your ${pet.relatedAnimals[found].relation}!`})
      }
      else {
        return res.status(403).send({error: `You have already requested ${animal.name} to be your ${pet.relatedAnimals[found].relation}!`})
      }
    }
      const oppRelation = (relation === 'Sibling' || relation === 'Friend') ? relation : 'Child'
      const objAnimal = {
        relation: relation,
        confirmed: false,
        animal: animal._id,
      }
      const objRelatedAnimal = {
        relation: oppRelation,
        confirmed: false,
        animal: pet._id,
      }
      await Animal.updateOne({_id: animal._id}, {$push : {relatedAnimals: objAnimal}});
      await Animal.updateOne({_id: relatedAnimal._id}, {$push: {relatedAnimals: objRelatedAnimal}});
      return res.status(201).json({message: "Your request has been sent successfully!"})
  }
  catch (err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
}

module.exports.confirmRelation = async (req, res, next) => {
  const animal = res.locals.animal;
  const {idRelatedAnimal} = req.body;
  try {
    const relatedAnimal = await Animal.findById(idRelatedAnimal);
    if (!relatedAnimal) return res.status(404).send({error: 'Invalid animal!'})
    const found = animal.relatedAnimals.findIndex(function(ele,index) {
      if (ele.animal == idRelatedAnimal) return true;
    })
    const foundRelated = relatedAnimal.relatedAnimals.findIndex(function(ele,index) {
      if (ele.animal == animal._id) return true;
    })
    if (found == -1 || foundRelated == -1) {
      return res.status(404).send({error: `There is no request from ${relatedAnimal.name}`});
    }
    const objId = animal.relatedAnimals[found]._id;
    const relatedId = relatedAnimals[foundRelated]._id;
    await Animal.updateOne({'relatedAnimals._id': objId}, {'$set': {
      'relatedAnimals.$.confirmed': true,
      }})
    await Animal.updateOne({'relatedAnimals._id': newId}, {'$set' : {
      'relatedAnimals.$.confirmed' : true,
    }})
  }
  catch (err) {
    logger.info(err);
    console.log(err);
    next(err);
  }
}
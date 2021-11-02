const Animal = require('../models/Animal');
const Post = require('../models/Post');
const Followers = require('../models/Followers');
const Following = require('../models/Following');
const ObjectId = require('mongoose').Types.ObjectId;
const logger = require('../logger/logger');
const bcrypt = require('bcrypt');

module.exports.registerPet = async (req, res, next) => {
    // const user = res.locals.user;
    // const {name, username, category, bio, animal_type, gender, breed, age, 
    // mating, adoption, playBuddies, playFrom, playTo, servicePet, spayed, 
    // friendlinessWithHumans, friendlinessWithAnimals, favouriteThings, thingsDislikes, 
    // uniqueHabits, eatingHabits, location} = req.body;
    const {name, username, category, animal_type} = req.body;
        
    try {
        const pet = new Animal({name, username, category, animal_type});
        await pet.save();
        return res.status(201).send(pet);
    }
    catch (err) {
        console.log(err);
        return res.status(400).send({ error: err});
    }
}




module.exports.addGuardian = async (req, res, next) => {
    const {idPet, idUser} = req.body;
    try{
      const animal = await Animal.findById(idPet);
      const user = await User.findById(idUser);
      if (!animal || !user) return res.status(404).send({error: 'No such pet or user exists!'});
      const userObject = {
        user: user._id,
        confirmed: false,
      };
      const petObject = {
        pet: animal._id,
        confirmed: false,
      };
      //TODO: user ...pet table m add
      await User.updateOne({_id: idUser}, {$push: {pets: petObject}});
      await Animal.updateOne({_id: user._id}, {$push: {guardians: userObject}});
    }
    catch (err){
      logger.info(err);
      res.status(400).send({error: err});
    }
};

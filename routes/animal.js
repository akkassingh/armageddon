const express = require("express");
const animalRouter = express.Router();
const multer = require("multer");

const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
}).any();

const {
  registerPet,
  addGuardian,
  getPetDetails,
  editPet,
  editPetHabits,
  getGuardians,
  confirmRelation,
  addRelatedAnimals,
  getRelations,
  getRelationRequests,
  getUniquePetName,
  editPetMainDetails,
  confirmGuardian,
  rejectRelation,
  rejectGuardian,
  setAmbassador,
  editBreedAndAge
} = require("../controllers/animalController");

const { requireAuth, requireAuthAnimal } = require("../controllers/authController");

animalRouter.post("/register", upload, requireAuth, registerPet); //ok
animalRouter.post("/addGuardian", addGuardian); //ok
// animalRouter.post("/getPetDetails", requireAuth, getPetDetails); //ok
animalRouter.post("/getPetDetails", getPetDetails); //ok
animalRouter.post("/editPet", upload, requireAuth, editPet); //ok
animalRouter.post("/editPetHabits", requireAuth, editPetHabits); //ok
animalRouter.post('/getGuardians', requireAuth, getGuardians); //ok
animalRouter.post("/getRelations",getRelations); //ok
animalRouter.post('/confirmRelation', confirmRelation); //ok
animalRouter.post('/sendRelationRequest', addRelatedAnimals);
animalRouter.post('/getRelationRequests', getRelationRequests); //ok
animalRouter.get('/getUniquePetName', getUniquePetName);
animalRouter.patch('/editPetMainDetails' ,requireAuth, editPetMainDetails);
animalRouter.post('/rejectRelation',rejectRelation);
animalRouter.post('/confirmGuardian', requireAuth, confirmGuardian);
animalRouter.post('/rejectGuardian', requireAuth, rejectGuardian);
animalRouter.post('/setAmbassador', setAmbassador);
animalRouter.post('/editBreedAndAge', requireAuth, editBreedAndAge);


module.exports = animalRouter;


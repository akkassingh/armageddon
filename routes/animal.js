const express = require("express");
const animalRouter = express.Router();
const multer = require("multer");

const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
}).any();

const { registerPet, addGuardian, getPetDetails, editPet } = require("../controllers/animalController");

const { requireAuth } = require("../controllers/authController");

animalRouter.post("/register", upload, requireAuth, registerPet);
animalRouter.patch("/addGuardian", addGuardian);
animalRouter.post("/getPetDetails", requireAuth, getPetDetails);
animalRouter.post("/editPet", requireAuth, editPet);

module.exports = animalRouter;

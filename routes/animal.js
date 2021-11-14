const express = require("express");
const animalRouter = express.Router();
const multer = require("multer");

const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
}).any();

const { registerPet, addGuardian } = require("../controllers/animalController");

const { requireAuth } = require("../controllers/authController");

animalRouter.post("/register", upload, requireAuth, registerPet);
animalRouter.patch("/addGuardian", addGuardian);

module.exports = animalRouter;

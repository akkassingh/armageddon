const express = require('express');
const animalRouter = express.Router();
const multer = require('multer');

const {
    registerPet,
    addGuardian,
} = require('../controllers/animalController');

const { 
    requireAuth,
} = require('../controllers/authController');

animalRouter.post('/register', requireAuth, registerPet);
animalRouter.patch('/addGuardian', addGuardian);

module.exports = animalRouter;
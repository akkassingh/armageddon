const express = require('express')
const mongoose = require('mongoose')
const serviceRouter = express.Router()
const {
    getAllServiceProviders, createServiceProvider
}  = require('../controllers/serviceController')


serviceRouter.get('/', getAllServiceProviders);
serviceRouter.post('/createServiceProvider', createServiceProvider);

module.exports = serviceRouter
const express = require("express");
const serviceRouter = express.Router();
const multer = require("multer");

const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
}).any();

const {
  serviceProvidersList,
  bookService,
  generateRazorPayOrderId,
} = require("../controllers/serviceBookingController");

const { requireAuth } = require("../controllers/authController");

//get service providers list
serviceRouter.get("/serviceProvidersList", requireAuth, serviceProvidersList);
//bookService
serviceRouter.post("/serviceBooking", requireAuth, bookService);

//generatePaymentIntent
serviceRouter.post("/generateOrderId", requireAuth, generateRazorPayOrderId);

//updatePaymentStatus

//fetchPetInformation to show in the pet dropdown

module.exports = serviceRouter;

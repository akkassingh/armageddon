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
  getPetDetails,
  getmybookedAppointments,
  getmyactiveAppointments,
  getmypastAppointments,
  getAppointmentDetails,
  getscrollAppointmentstatus,
  changeAppointmentstatus
} = require("../controllers/serviceBookingController");

const { requireAuth } = require("../controllers/authController");

//get service providers list
serviceRouter.get("/serviceProvidersList", requireAuth, serviceProvidersList);
//bookService
serviceRouter.post("/serviceBooking", requireAuth, bookService);
serviceRouter.post("/getPetDetails", requireAuth, getPetDetails);


serviceRouter.post("/getmybookedAppointments", requireAuth, getmybookedAppointments);
serviceRouter.post("/getmyactiveAppointments", requireAuth, getmyactiveAppointments);
serviceRouter.post("/getmypastAppointments", requireAuth, getmypastAppointments);
serviceRouter.post("/getAppointmentDetails", requireAuth, getAppointmentDetails);
serviceRouter.post("/getscrollAppointmentstatus", requireAuth, getscrollAppointmentstatus);
serviceRouter.post("/changeAppointmentstatus", requireAuth, changeAppointmentstatus);

//generatePaymentIntent
serviceRouter.post("/generateOrderId", requireAuth, generateRazorPayOrderId);

//updatePaymentStatus

//fetchPetInformation to show in the pet dropdown

module.exports = serviceRouter;

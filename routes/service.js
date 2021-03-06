const express = require("express");
const serviceRouter = express.Router();
const multer = require("multer");

const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
}).any();

const {
  serviceList,
  createService,
  addBackgroundCheckToService,
  addDogWalkingPreferences,
  addServiceProfile,
  getCreatedServicesList,
  sendReviewsandRatings,
  changeAppointmentstatus,
  getAppointmentDetails,
  generateReport,
  BackgroundCheckStatus,
  getDogWalkingPreferences,
  isSentforApproval,
  getServiceProfile,
  getmyactiveAppointments,
  getmypastAppointments,
  getscrollAppointmentstatus,
  getReport,
  changeRunstatus,
  getServiceProviderProfile,
  postPayment,
  getQuickbloxDetails,
  postTrainingPayment,
  generateTrainingReport,
  getTrainingReport,
  changeSessionstatus,
  getTrainingAppointmentDetails,
  getscrollSessionstatus,
  hasAppointments
} = require("../controllers/serviceController");

const { requireAuth } = require("../controllers/authController");

serviceRouter.post("/serviceList", requireAuth, serviceList);
serviceRouter.post("/service", requireAuth, createService);
serviceRouter.post(
  "/backgroundCheck",
  multer({
    dest: "temp/",
  }).any(),
  requireAuth,
  addBackgroundCheckToService
);
serviceRouter.post("/preferences", requireAuth, addDogWalkingPreferences);
serviceRouter.post("/serviceProfile", upload, requireAuth, addServiceProfile);

serviceRouter.post("/getServices", upload, requireAuth, getCreatedServicesList);
serviceRouter.post("/sendReviewsandRatings", requireAuth, sendReviewsandRatings);
serviceRouter.post("/BackgroundCheckStatus", requireAuth, BackgroundCheckStatus);

serviceRouter.post("/getDogWalkingPreferences", requireAuth, getDogWalkingPreferences);

serviceRouter.post("/isSentforApproval", requireAuth, isSentforApproval);
serviceRouter.post("/getServiceProfile", requireAuth, getServiceProfile);


serviceRouter.post("/getmyactiveAppointments", requireAuth, getmyactiveAppointments);
serviceRouter.post("/getmypastAppointments", requireAuth, getmypastAppointments);

serviceRouter.post("/changeAppointmentstatus", requireAuth, changeAppointmentstatus);
serviceRouter.post("/getAppointmentDetails", requireAuth, getAppointmentDetails);
serviceRouter.post("/generateReport", upload, requireAuth, generateReport);

serviceRouter.post("/generateTrainingReport", upload, requireAuth, generateTrainingReport);

serviceRouter.post("/getReport", upload, requireAuth, getReport);
serviceRouter.post("/getTrainingReport", requireAuth, getTrainingReport);

serviceRouter.post("/getscrollAppointmentstatus", requireAuth, getscrollAppointmentstatus);
serviceRouter.post("/changeRunstatus", requireAuth, changeRunstatus);

serviceRouter.post("/getServiceProviderProfile", requireAuth, getServiceProviderProfile);
serviceRouter.patch("/postPayment", requireAuth, postPayment);
serviceRouter.post("/changeSessionstatus", requireAuth, changeSessionstatus);
serviceRouter.post("/getTrainingAppointmentDetails", requireAuth, getTrainingAppointmentDetails);

serviceRouter.patch("/postTrainingPayment", requireAuth, postTrainingPayment);

serviceRouter.post("/getQuickbloxDetails", requireAuth, getQuickbloxDetails);
serviceRouter.post("/hasAppointments", requireAuth, hasAppointments);

serviceRouter.post("/getscrollSessionstatus", requireAuth, getscrollSessionstatus);

module.exports = serviceRouter;

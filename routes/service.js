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
} = require("../controllers/serviceController");

const { requireAuth } = require("../controllers/authController");

serviceRouter.post("/serviceList", requireAuth, serviceList);
serviceRouter.post("/service", requireAuth, createService);
serviceRouter.post(
  "/backgroundCheck",
  upload,
  requireAuth,
  addBackgroundCheckToService
);

module.exports = serviceRouter;

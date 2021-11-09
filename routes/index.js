const express = require("express");
const authRouter = require("./auth");
const userRouter = require("./user");
const animalRouter = require("./animal");
const postRouter = require("./post");
const commentRouter = require("./comment");
const notificationRouter = require("./notification");
const serviceRouter = require("./service");
const serviceBookingRouter = require("./serviceBooking");
const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/post", postRouter);
apiRouter.use("/comment", commentRouter);
apiRouter.use("/notification", notificationRouter);
apiRouter.use("/animal", animalRouter);
apiRouter.use("/service", serviceRouter);
apiRouter.use("/serviceBooking", serviceBookingRouter);
module.exports = apiRouter;

//-------code to add initial services types-----------------------------
(async () => {
  try {
    const ServiceType = require("../models/ServiceType");
    let ServiceType1 = new ServiceType({
      name: "Dog Walking",
      description: "Taking the pet for walks and exercise",
    });
    await ServiceType1.save();
  } catch (e) {
    //   console.log(e);
  }
})();

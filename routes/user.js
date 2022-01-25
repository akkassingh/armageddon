const express = require("express");
const userRouter = express.Router();
const multer = require("multer");

const {
  retrieveUser,
  retrievePosts,
  bookmarkPost,
  followUser,
  retrieveFollowing,
  retrieveFollowers,
  searchUsers,
  confirmUser,
  changeAvatar,
  removeAvatar,
  updateProfile,
  retrieveSuggestedUsers,
  isUsernameAvaialble,
  becomeGuardian,
  petanduserdetails,
  getUserDetails,
  updateBioAndAvatar,
  showPeopleToFollow,
  getPendingGuardianRequests,
  getUserDetailsById,
  getAvatarLink
} = require("../controllers/userController");
const { requireAuth, optionalAuth } = require("../controllers/authController");

userRouter.post("/getPendingGuardianRequests",requireAuth,getPendingGuardianRequests)
userRouter.get("/userDetails", requireAuth, getUserDetails);
userRouter.post("/getUserDetailsById", getUserDetailsById);
userRouter.post('/showPeopleToFollow',requireAuth, showPeopleToFollow);
userRouter.get("/suggested/:max?", requireAuth, retrieveSuggestedUsers);
userRouter.get("/:username", optionalAuth, retrieveUser);
userRouter.post("/:username/posts", retrievePosts);
userRouter.post("/following", requireAuth, retrieveFollowing);
userRouter.post("/followers", requireAuth, retrieveFollowers);
userRouter.post("/search",requireAuth, searchUsers);

userRouter.put("/confirm", requireAuth, confirmUser);
userRouter.put(
  "/avatar",
  multer({
    dest: "temp/",
    limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
  }).single("image"),
  requireAuth,
  changeAvatar
);
userRouter.put("/", requireAuth, updateProfile);
userRouter.put("/bioAndAvatar", requireAuth, updateBioAndAvatar);

userRouter.delete("/avatar", requireAuth, removeAvatar);

userRouter.post("/:postId/bookmark", requireAuth, bookmarkPost);
userRouter.post("/:userId/follow", requireAuth, followUser);
userRouter.get(
  "/isusernameavailable/:username",
  requireAuth,
  isUsernameAvaialble
);
userRouter.post("/addPet", requireAuth, becomeGuardian);
userRouter.patch("/petanduserdetails", requireAuth, petanduserdetails);
userRouter.post("/getAvatarLink",multer({
  dest: "temp/",
}).single("image"), requireAuth, getAvatarLink);
module.exports = userRouter;

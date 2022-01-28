const express = require("express");
const productRouter = express.Router();
const multer = require("multer");

const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
}).any();

const {requireAuth} = require("../controllers/authController");
const {
    addProduct, 
    getProducts,
    addToCart,
    getCartDetails,
    addToFavourites,
    getFavouriteDetails
} = require("../controllers/productController");


productRouter.post("/addProduct", upload, requireAuth, addProduct);
productRouter.post("/getProducts", requireAuth, getProducts);
productRouter.post("/addToCart", requireAuth, addToCart);
productRouter.post("/getCartDetails", requireAuth, getCartDetails);
productRouter.post("/addToFavourites", requireAuth, addToFavourites)
productRouter.post("/getFavouriteDetails", requireAuth, getFavouriteDetails);

module.exports = productRouter;
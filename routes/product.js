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
} = require("../controllers/productController");


productRouter.post("/addProduct", upload, requireAuth, addProduct);
productRouter.post("/getProducts", requireAuth, getProducts);

module.exports = productRouter;
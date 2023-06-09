const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  getMyProducts,
  getProductById,
  upload
} = require("../controller/productController");
const { protect } = require("../controller/authController");

router.post("/create", protect, createProduct);
router.patch("/upload/:product_id", protect, upload);
router.get("/getAll", protect, getAllProducts);
router.get("/my", protect, getMyProducts);
router.get("/:product_id", protect, getProductById);

router.patch("/update/:id", protect, updateProduct)
router.delete("/delete/:id", protect, deleteProduct);

module.exports = router;

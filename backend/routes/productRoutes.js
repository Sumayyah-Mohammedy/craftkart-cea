const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require("../controllers/productController");

// Public routes
router.get("/", getProducts);
router.get("/:slug", getProduct);

// Protected seller routes
router.post("/", protect, authorize("seller"), createProduct);
router.put("/:id", protect, authorize("seller", "admin"), updateProduct);
router.delete("/:id", protect, authorize("seller", "admin"), deleteProduct);
router.get("/seller/my-products", protect, authorize("seller"), getMyProducts);

module.exports = router;

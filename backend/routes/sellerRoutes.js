const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  submitVerification,
  getSellerDashboard,
  getSellerOrders,
  updateOrderStatus,
} = require("../controllers/sellerController");

// All seller routes require authentication and seller role
router.use(protect);
router.use(authorize("seller"));

router.post(
  "/verify",
  upload.fields([
    { name: "cnicImages", maxCount: 2 },
    { name: "selfie", maxCount: 1 },
  ]),
  submitVerification
);

router.get("/dashboard", getSellerDashboard);
router.get("/orders", getSellerOrders);
router.put("/orders/:id/status", updateOrderStatus);

module.exports = router;

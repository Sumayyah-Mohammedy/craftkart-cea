const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAllUsers,
  suspendUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getAnalytics,
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// User management
router.get("/users", getAllUsers);
router.put("/users/:id/suspend", suspendUser);

// Verification management
router.get("/verifications", getPendingVerifications);
router.put("/verifications/:id/approve", approveVerification);
router.put("/verifications/:id/reject", rejectVerification);

// Analytics
router.get("/analytics", getAnalytics);

module.exports = router;

const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { pagination, pageParams } = require("../models/mappers");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const { page, limit, offset } = pageParams(req.query, 20);
  const { users, total } = await User.list({ role, search, limit, offset });
  res.status(200).json({ success: true, data: { users, pagination: pagination(page, limit, total) } });
});

// @desc    Suspend / unsuspend user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (Admin)
exports.suspendUser = asyncHandler(async (req, res) => {
  const suspend = Boolean(req.body.suspend);
  if (!(await User.findById(req.params.id))) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const user = await User.setFlags(req.params.id, { isSuspended: suspend });
  res.status(200).json({
    success: true,
    message: `User ${suspend ? "suspended" : "unsuspended"} successfully`,
    data: { user },
  });
});

// @desc    Get pending verifications
// @route   GET /api/admin/verifications
// @access  Private (Admin)
exports.getPendingVerifications = asyncHandler(async (req, res) => {
  const profiles = await SellerProfile.listPending();
  res.status(200).json({ success: true, data: { profiles } });
});

// @desc    Approve verification
// @route   PUT /api/admin/verifications/:id/approve
// @access  Private (Admin)
exports.approveVerification = asyncHandler(async (req, res) => {
  const existing = await SellerProfile.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Seller profile not found" });
  }
  const profile = await SellerProfile.setStatus(req.params.id, "approved");
  await User.setFlags(profile.userId, { isVerified: true });
  res.status(200).json({ success: true, message: "Seller verification approved", data: { profile } });
});

// @desc    Reject verification
// @route   PUT /api/admin/verifications/:id/reject
// @access  Private (Admin)
exports.rejectVerification = asyncHandler(async (req, res) => {
  const existing = await SellerProfile.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Seller profile not found" });
  }
  const profile = await SellerProfile.setStatus(req.params.id, "rejected", { reason: req.body.reason });
  res.status(200).json({ success: true, message: "Seller verification rejected", data: { profile } });
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const [users, products, orders, sellers, revenue] = await Promise.all([
    User.count(),
    Product.count(),
    Order.count(),
    User.count({ role: "seller", isVerified: true }),
    Order.totalRevenue(),
  ]);
  res.status(200).json({ success: true, data: { users, products, orders, sellers, revenue } });
});

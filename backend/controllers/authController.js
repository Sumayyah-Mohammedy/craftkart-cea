const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "24h" });

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Admin accounts cannot be self-registered (created by the seed script only)
  const safeRole = role === "seller" ? "seller" : "buyer";

  if (email && (await User.findByEmail(email))) {
    return res.status(400).json({ success: false, message: "User already exists with this email" });
  }

  const user = await User.create({ name, email, password, role: safeRole, phone });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  const user = await User.findByEmail(email, { withPassword: true });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  if (user.isSuspended) {
    return res.status(403).json({ success: false, message: "Your account has been suspended" });
  }
  if (!(await User.comparePassword(user, password))) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
      token: generateToken(user._id),
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: { user } });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;
  const user = await User.updateProfile(req.user._id, { name, phone, addresses });
  res.status(200).json({ success: true, message: "Profile updated successfully", data: { user } });
});

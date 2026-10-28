const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getPopulated(req.user._id);
  res.status(200).json({ success: true, data: { cart } });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, variantSku } = req.body;
  const quantity = Number(req.body.quantity || 1);

  const product = await Product.findById(productId);
  if (!product || product.status !== "active") {
    return res.status(404).json({ success: false, message: "Product not found or unavailable" });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, message: "Quantity must be a positive integer" });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ success: false, message: "Insufficient stock" });
  }

  await Cart.addItem(req.user._id, productId, variantSku, quantity);
  const cart = await Cart.getPopulated(req.user._id);
  res.status(200).json({ success: true, message: "Item added to cart", data: { cart } });
});

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!(await Cart.exists(req.user._id))) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }
  const ok = await Cart.setItemQuantity(req.user._id, req.params.itemId, quantity);
  if (!ok) {
    return res.status(404).json({ success: false, message: "Item not found in cart" });
  }
  const cart = await Cart.getPopulated(req.user._id);
  res.status(200).json({ success: true, message: "Cart updated", data: { cart } });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  if (!(await Cart.exists(req.user._id))) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }
  await Cart.removeItem(req.user._id, req.params.itemId);
  const cart = await Cart.getPopulated(req.user._id);
  res.status(200).json({ success: true, message: "Item removed from cart", data: { cart } });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.clear(req.user._id);
  res.status(200).json({ success: true, message: "Cart cleared" });
});

const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { pagination, pageParams } = require("../models/mappers");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, rating, sort = "-createdAt" } = req.query;
  const { page, limit, offset } = pageParams(req.query, 20);

  const { products, total } = await Product.search({ search, category, minPrice, maxPrice, rating, sort, limit, offset });

  res.status(200).json({ success: true, data: { products, pagination: pagination(page, limit, total) } });
});

// @desc    Get single product (route param is named slug but the frontend passes the id)
// @route   GET /api/products/:slug
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.slug, { populateSeller: true });
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  res.status(200).json({ success: true, data: { product } });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private (Seller only)
exports.createProduct = asyncHandler(async (req, res) => {
  const { title, description, category, price, images, variants, stock, status } = req.body;
  const product = await Product.create({
    sellerId: req.user._id, title, description, category, price, images, variants, stock, status,
  });
  res.status(201).json({ success: true, message: "Product created successfully", data: { product } });
});

const canModify = (product, user) =>
  String(product.sellerId) === String(user._id) || user.role === "admin";

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller owner / Admin)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  if (!canModify(product, req.user)) {
    return res.status(403).json({ success: false, message: "Not authorized to update this product" });
  }
  const updated = await Product.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Product updated successfully", data: { product: updated } });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller owner / Admin)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  if (!canModify(product, req.user)) {
    return res.status(403).json({ success: false, message: "Not authorized to delete this product" });
  }
  await Product.remove(req.params.id);
  res.status(200).json({ success: true, message: "Product deleted successfully" });
});

// @desc    Get seller's products
// @route   GET /api/products/seller/my-products
// @access  Private (Seller only)
exports.getMyProducts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req.query, 20);
  const { products, total } = await Product.listBySeller(req.user._id, { status: req.query.status, limit, offset });
  res.status(200).json({ success: true, data: { products, pagination: pagination(page, limit, total) } });
});

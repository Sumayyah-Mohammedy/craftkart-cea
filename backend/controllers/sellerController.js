const SellerProfile = require("../models/SellerProfile");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { pagination, pageParams } = require("../models/mappers");

const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

// @desc    Submit seller verification (documents are uploaded to object storage by the
//          browser; only their URLs are stored here)
// @route   POST /api/seller/verify
// @access  Private (Seller)
exports.submitVerification = asyncHandler(async (req, res) => {
  const { businessName, cnic, shopDescription, bankDetails, cnicImages, selfie } = req.body;
  const profile = await SellerProfile.upsert(req.user._id, {
    businessName,
    cnic,
    shopDescription,
    bankDetails,
    cnicImages: Array.isArray(cnicImages) ? cnicImages : [],
    selfieImage: selfie || null,
  });
  res.status(200).json({ success: true, message: "Verification submitted successfully", data: { profile } });
});

// @desc    Get seller dashboard
// @route   GET /api/seller/dashboard
// @access  Private (Seller)
exports.getSellerDashboard = asyncHandler(async (req, res) => {
  const sellerId = String(req.user._id);
  const { orders } = await Order.listBySeller(sellerId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= todayStart);

  // Revenue = only this seller's items in each order
  const sellerRevenue = (list) =>
    list.reduce(
      (sum, o) =>
        sum + o.items.filter((i) => String(i.sellerId) === sellerId).reduce((s, i) => s + i.price * i.quantity, 0),
      0
    );

  const { products } = await Product.listBySeller(sellerId);

  res.status(200).json({
    success: true,
    data: {
      analytics: {
        orders: {
          total: orders.length,
          today: todayOrders.length,
          pending: orders.filter((o) => o.orderStatus === "pending").length,
        },
        revenue: { total: sellerRevenue(orders), today: sellerRevenue(todayOrders) },
        products: { total: products.length, active: products.filter((p) => p.status === "active").length },
      },
    },
  });
});

// @desc    Get seller orders
// @route   GET /api/seller/orders
// @access  Private (Seller)
exports.getSellerOrders = asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req.query, 20);
  const { orders, total } = await Order.listBySeller(req.user._id, { status: req.query.status, limit, offset });
  res.status(200).json({ success: true, data: { orders, pagination: pagination(page, limit, total) } });
});

// @desc    Update order status
// @route   PUT /api/seller/orders/:id/status
// @access  Private (Seller)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid order status" });
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!order.items.some((i) => String(i.sellerId) === String(req.user._id))) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  const updated = await Order.updateStatus(req.params.id, status, note);
  res.status(200).json({ success: true, message: "Order status updated", data: { order: updated } });
});

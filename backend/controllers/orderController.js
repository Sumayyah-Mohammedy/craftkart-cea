const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { withTransaction } = require("../config/database");
const { pagination, pageParams, isUuid } = require("../models/mappers");

class OrderError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Validate line items, reserve stock and create the order in ONE transaction,
 * so a failure half-way never leaves stock decremented without an order, and
 * two buyers (on different app instances) can never oversell the same stock.
 * `lines` = [{ productId, variantSku, quantity }]
 */
async function placeOrder({ buyerId, lines, shippingAddress, paymentMethod, paymentStatus, stripe }) {
  return withTransaction(async (client) => {
    let subtotal = 0;
    const items = [];
    for (const line of lines) {
      const quantity = Number(line.quantity);
      if (!isUuid(String(line.productId)) || !Number.isInteger(quantity) || quantity < 1) {
        throw new OrderError(`Invalid item ${line.productId}`);
      }
      const { rows } = await client.query("SELECT * FROM products WHERE id = $1 FOR UPDATE", [line.productId]);
      const product = rows[0];
      if (!product || product.status !== "active") {
        throw new OrderError(`Product ${line.productId} not available`);
      }
      if (!(await Product.reserveStock(client, product.id, quantity))) {
        throw new OrderError(`Insufficient stock for ${product.title}`);
      }
      subtotal += product.price * quantity;
      items.push({
        productId: product.id,
        sellerId: product.seller_id,
        title: product.title,
        image: (product.images || [])[0],
        variantSku: line.variantSku,
        quantity,
        price: product.price,
      });
    }
    if (!items.length) throw new OrderError("Order has no items");

    const order = await Order.create(client, {
      buyerId,
      items,
      shippingAddress,
      ...Order.totals(subtotal),
      paymentMethod,
      paymentStatus,
      stripeSessionId: stripe?.sessionId,
      stripePaymentIntentId: stripe?.paymentIntentId,
    });
    await Cart.clear(buyerId, client);
    return order;
  });
}
exports.placeOrder = placeOrder;
exports.OrderError = OrderError;

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ success: false, message: "Order must contain at least one item" });
  }
  const order = await placeOrder({
    buyerId: req.user._id,
    lines: items,
    shippingAddress,
    paymentMethod,
    // Card payments go through Stripe (see stripeController); anything else is paid later
    paymentStatus: paymentMethod === "cod" ? "pending" : "completed",
  });
  res.status(201).json({ success: true, message: "Order created successfully", data: { order } });
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req.query, 10);
  const { orders, total } = await Order.listByBuyer(req.user._id, { status: req.query.status, limit, offset });
  res.status(200).json({ success: true, data: { orders, pagination: pagination(page, limit, total) } });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (buyer, a seller in the order, or admin)
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id, { populateBuyer: true });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  const me = String(req.user._id);
  const isBuyer = order.buyerId && String(order.buyerId._id) === me;
  const isSeller = order.items.some((i) => String(i.sellerId) === me);
  if (!isBuyer && !isSeller && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not authorized to view this order" });
  }
  res.status(200).json({ success: true, data: { order } });
});

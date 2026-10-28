const { getStripe } = require("../utils/stripe");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { placeOrder } = require("./orderController");

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";

// @desc    Create a Stripe Checkout session from the user's cart
// @route   POST /api/orders/create-stripe-session
// @access  Private
exports.createStripeSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const cart = await Cart.getPopulated(req.user._id);
  if (!cart.items.length) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  const line_items = cart.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.productId.title,
        images: item.productId.images?.length ? [item.productId.images[0]] : [],
      },
      unit_amount: Math.round(item.productId.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: `${frontendUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl()}/checkout`,
    client_reference_id: String(req.user._id),
    metadata: { userId: String(req.user._id), cartId: String(cart._id) },
  });

  res.status(200).json({ success: true, url: session.url });
});

// @desc    Verify a paid Stripe session and turn the cart into an order (idempotent)
// @route   GET /api/orders/verify-stripe?session_id=...
// @access  Private
exports.verifyStripePayment = asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ success: false, message: "Missing session_id" });
  }

  const existing = await Order.findByStripeSession(session_id);
  if (existing) return res.status(200).json({ success: true, orderId: existing._id });

  const session = await getStripe().checkout.sessions.retrieve(session_id);
  if (session.payment_status !== "paid") {
    return res.status(400).json({ success: false, message: "Payment not completed" });
  }
  if (session.metadata?.userId && session.metadata.userId !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "Session does not belong to this user" });
  }

  const cart = await Cart.getPopulated(req.user._id);
  if (!cart.items.length) {
    return res.status(400).json({ success: false, message: "Cart not found - order may have been processed already" });
  }

  const user = await User.findById(req.user._id);
  const address = (user.addresses || []).find((a) => a.isDefault) || (user.addresses || [])[0] || {};

  try {
    const order = await placeOrder({
      buyerId: req.user._id,
      lines: cart.items.map((i) => ({ productId: i.productId._id, variantSku: i.variantSku, quantity: i.quantity })),
      shippingAddress: address,
      paymentMethod: "card",
      paymentStatus: "completed",
      stripe: { sessionId: session_id, paymentIntentId: session.payment_intent },
    });
    res.status(200).json({ success: true, orderId: order._id });
  } catch (err) {
    // Unique stripe_session_id: a concurrent request already created the order
    if (err.code === "23505") {
      const again = await Order.findByStripeSession(session_id);
      if (again) return res.status(200).json({ success: true, orderId: again._id });
    }
    throw err;
  }
});

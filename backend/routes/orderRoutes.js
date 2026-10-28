const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// Import controllers
const {
  createOrder,
  getOrders,
  getOrder,
} = require("../controllers/orderController");

const { 
  createStripeSession, 
  verifyStripePayment 
} = require('../controllers/stripeController');

// All order routes require authentication
router.use(protect);


// Stripe payment routes
router.post('/create-stripe-session', createStripeSession);
router.get('/verify-stripe', verifyStripePayment);

//regular order routes
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);

module.exports = router;

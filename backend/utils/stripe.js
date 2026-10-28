// Centralised, lazily-created Stripe client.
// The secret key is read from the environment (injected from AWS Secrets Manager);
// the app still boots without it so health checks and non-payment features work.
const Stripe = require("stripe");

let client;

function getStripe() {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error("Card payments are not configured (STRIPE_SECRET_KEY missing)");
    err.statusCode = 503;
    throw err;
  }
  client = new Stripe(key);
  return client;
}

module.exports = { getStripe };

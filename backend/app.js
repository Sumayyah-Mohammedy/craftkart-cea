// ============================================
// Express application (Application Tier). Exported separately from server.js
// so automated tests can exercise it without opening a port.
// ============================================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { pool } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Requests arrive through Nginx (web tier) and the AWS load balancers
app.set("trust proxy", true);
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:3000").split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Structured (JSON) access log -> stdout -> Docker awslogs driver -> CloudWatch Logs
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      if (req.path.startsWith("/api/health")) return; // skip LB health-check noise
      console.log(JSON.stringify({
        level: "info", msg: "request", method: req.method, path: req.originalUrl,
        status: res.statusCode, ms: Number(process.hrtime.bigint() - start) / 1e6, ip: req.ip,
      }));
    });
    next();
  });
}

// Brute-force protection on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 100),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later" },
});

// ============================================
// HEALTH CHECKS (used by the load balancer target groups + CI/CD smoke test)
// ============================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    version: process.env.APP_VERSION || "dev",
    instance: process.env.INSTANCE_ID || require("os").hostname(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "OK", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "DEGRADED", database: "unreachable" });
  }
});

// ============================================
// API ROUTES
// ============================================
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to CraftKart API",
    version: process.env.APP_VERSION || "dev",
    endpoints: ["/api/health", "/api/auth", "/api/products", "/api/cart", "/api/orders", "/api/seller", "/api/admin"],
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(errorHandler);

module.exports = app;

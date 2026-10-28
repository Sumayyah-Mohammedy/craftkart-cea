// ============================================
// Entry point: connect + migrate PostgreSQL, start HTTP server,
// shut down gracefully on SIGTERM (sent by Docker during rolling deploys).
// ============================================
require("dotenv").config();

const app = require("./app");
const { connectDB, pool } = require("./config/database");

const PORT = process.env.PORT || 5000;

for (const name of ["JWT_SECRET"]) {
  if (!process.env[name]) {
    console.error(JSON.stringify({ level: "fatal", msg: `${name} is not set` }));
    process.exit(1);
  }
}

async function start() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(JSON.stringify({ level: "info", msg: "server started", port: Number(PORT), version: process.env.APP_VERSION || "dev" }));
  });

  const shutdown = (signal) => {
    console.log(JSON.stringify({ level: "info", msg: "shutting down", signal }));
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 15000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

process.on("unhandledRejection", (err) => {
  console.error(JSON.stringify({ level: "fatal", msg: "unhandled rejection", error: err && err.message }));
  process.exit(1);
});

start().catch((err) => {
  console.error(JSON.stringify({ level: "fatal", msg: "startup failed", error: err.message }));
  process.exit(1);
});

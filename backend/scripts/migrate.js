// Apply db/schema.sql (idempotent). The API also runs this automatically on start-up.
require("dotenv").config();
const { migrate, pool } = require("../config/database");

migrate()
  .then(() => { console.log("Schema up to date"); return pool.end(); })
  .catch((err) => { console.error("Migration failed:", err.message); process.exit(1); });

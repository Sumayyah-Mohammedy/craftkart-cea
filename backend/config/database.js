// ============================================
// PostgreSQL connection pool + migrations
// Credentials come ONLY from environment variables, which in AWS are
// injected at container start from AWS Secrets Manager (never hard-coded).
// ============================================
const fs = require("fs");
const path = require("path");
const { Pool, types } = require("pg");

// Return NUMERIC / BIGINT (count) columns as JS numbers instead of strings
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

function buildConfig() {
  // DB_SSL=true -> encrypt traffic to RDS. If DB_SSL_CA points to the AWS RDS
  // CA bundle (baked into the Docker image) the server certificate is verified too.
  let ssl = false;
  if (String(process.env.DB_SSL || "false").toLowerCase() === "true") {
    const caPath = process.env.DB_SSL_CA;
    ssl =
      caPath && fs.existsSync(caPath)
        ? { ca: fs.readFileSync(caPath, "utf8"), rejectUnauthorized: true }
        : { rejectUnauthorized: false };
  }

  const common = {
    ssl,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ...common };
  }
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "craftkart",
    user: process.env.DB_USER || "craftkart",
    password: process.env.DB_PASSWORD,
    ...common,
  };
}

const pool = new Pool(buildConfig());

pool.on("error", (err) => {
  console.error(JSON.stringify({ level: "error", msg: "pg pool error", error: err.message }));
});

const query = (text, params) => pool.query(text, params);

// Run fn(client) inside a single DB transaction
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Apply schema.sql. An advisory lock makes this safe when several
// app containers (Auto Scaling Group) start at the same time.
async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(424242)");
    await client.query(sql);
  } finally {
    await client.query("SELECT pg_advisory_unlock(424242)").catch(() => {});
    client.release();
  }
}

async function connectDB({ retries = 10, delayMs = 3000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const { rows } = await pool.query("SELECT current_database() AS db, inet_server_addr() AS host");
      await migrate();
      console.log(JSON.stringify({ level: "info", msg: "PostgreSQL connected", db: rows[0].db, host: rows[0].host }));
      return;
    } catch (err) {
      console.error(JSON.stringify({ level: "error", msg: "PostgreSQL connection failed", attempt, error: err.message }));
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

module.exports = { pool, query, withTransaction, migrate, connectDB };

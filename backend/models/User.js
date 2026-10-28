// Data access for users (PostgreSQL)
const bcrypt = require("bcryptjs");
const { query } = require("../config/database");
const { toUser, isUuid, withIds } = require("./mappers");

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^03[0-9]{9}$/;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

function validate({ name, email, password, phone, role }, { partial = false } = {}) {
  const errors = [];
  if (!partial || name !== undefined) if (!name || !String(name).trim()) errors.push("Name is required");
  if (!partial || email !== undefined) {
    if (!email) errors.push("Email is required");
    else if (!EMAIL_RE.test(email)) errors.push("Please enter a valid email");
  }
  if (!partial || password !== undefined) {
    if (!password) errors.push("Password is required");
    else if (String(password).length < 6) errors.push("Password must be at least 6 characters");
  }
  if (phone && !PHONE_RE.test(phone)) errors.push("Please enter a valid Pakistani phone number");
  if (role && !["buyer", "seller", "admin"].includes(role)) errors.push("Invalid role");
  if (errors.length) throw new ValidationError(errors.join(", "));
}

const User = {
  ValidationError,

  async findById(id) {
    if (!isUuid(String(id))) return null;
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
    return toUser(rows[0]);
  },

  async findByEmail(email, { withPassword = false } = {}) {
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [String(email || "").toLowerCase().trim()]);
    return toUser(rows[0], { withPassword });
  },

  async create({ name, email, password, role = "buyer", phone, addresses = [], isVerified = false }) {
    validate({ name, email, password, phone, role });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name, email, password, role, phone, addresses, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [String(name).trim(), email.toLowerCase().trim(), hash, role, phone || null,
        JSON.stringify(withIds(addresses)), isVerified]
    );
    return toUser(rows[0]);
  },

  async comparePassword(user, candidate) {
    return bcrypt.compare(candidate, user.password);
  },

  async updateProfile(id, { name, phone, addresses }) {
    validate({ name, phone }, { partial: true });
    const { rows } = await query(
      `UPDATE users SET
         name      = COALESCE($2, name),
         phone     = COALESCE($3, phone),
         addresses = COALESCE($4::jsonb, addresses)
       WHERE id = $1 RETURNING *`,
      [id, name ? String(name).trim() : null, phone || null, addresses ? JSON.stringify(withIds(addresses)) : null]
    );
    return toUser(rows[0]);
  },

  async setFlags(id, { isSuspended, isVerified }) {
    const { rows } = await query(
      `UPDATE users SET
         is_suspended = COALESCE($2, is_suspended),
         is_verified  = COALESCE($3, is_verified)
       WHERE id = $1 RETURNING *`,
      [id, isSuspended ?? null, isVerified ?? null]
    );
    return toUser(rows[0]);
  },

  // Admin listing with optional role filter and case-insensitive search
  async list({ role, search, limit, offset }) {
    const where = [];
    const params = [];
    if (role) { params.push(role); where.push(`role = $${params.length}`); }
    if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = (await query(`SELECT count(*) FROM users ${clause}`, params)).rows[0].count;
    const { rows } = await query(
      `SELECT * FROM users ${clause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { users: rows.map((r) => toUser(r)), total };
  },

  async count(filter = {}) {
    if (filter.role) {
      const { rows } = await query(
        "SELECT count(*) FROM users WHERE role = $1 AND ($2::boolean IS NULL OR is_verified = $2)",
        [filter.role, filter.isVerified ?? null]
      );
      return rows[0].count;
    }
    return (await query("SELECT count(*) FROM users")).rows[0].count;
  },
};

module.exports = User;

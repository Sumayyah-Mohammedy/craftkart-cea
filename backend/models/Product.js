// Data access for products (PostgreSQL)
const slugify = require("slugify");
const { query } = require("../config/database");
const { toProduct, isUuid, userRef } = require("./mappers");

const CATEGORIES = ["Fashion", "Kitchenware", "Accessories", "Home Decor", "Jewellery", "Personal Care", "Stationary", "Others"];

// Whitelisted ?sort values (Mongoose-style "-field" = descending)
const SORTS = {
  createdAt: "p.created_at ASC", "-createdAt": "p.created_at DESC",
  price: "p.price ASC", "-price": "p.price DESC",
  rating: "p.rating ASC", "-rating": "p.rating DESC",
  soldCount: "p.sold_count ASC", "-soldCount": "p.sold_count DESC",
  title: "p.title ASC", "-title": "p.title DESC",
};

// Fields a seller/admin may change through PUT /api/products/:id
const UPDATABLE = {
  title: "title", description: "description", category: "category", price: "price",
  images: "images", variants: "variants", stock: "stock", status: "status",
  features: "features", tags: "tags",
};
const JSON_FIELDS = new Set(["images", "variants", "features", "tags"]);

const makeSlug = (title) => `${slugify(String(title), { lower: true, strict: true })}-${Date.now()}`;

const SELECT_WITH_SELLER = `
  SELECT p.*, u.id AS s_id, u.name AS s_name, u.email AS s_email
  FROM products p LEFT JOIN users u ON u.id = p.seller_id`;

const withSeller = (r) => toProduct(r, { seller: userRef(r, "s_") });

function validationError(message) {
  const e = new Error(message);
  e.name = "ValidationError";
  e.statusCode = 400;
  return e;
}

const Product = {
  CATEGORIES,

  async findById(id, { populateSeller = false } = {}) {
    if (!isUuid(String(id))) return null;
    if (populateSeller) {
      const { rows } = await query(`${SELECT_WITH_SELLER} WHERE p.id = $1`, [id]);
      return rows[0] ? withSeller(rows[0]) : null;
    }
    const { rows } = await query("SELECT * FROM products WHERE id = $1", [id]);
    return toProduct(rows[0]);
  },

  async create(data) {
    if (!data.title) throw validationError("Product title is required");
    if (!data.description) throw validationError("Product description is required");
    if (data.price === undefined || data.price === null || data.price === "") throw validationError("Price is required");
    if (!CATEGORIES.includes(data.category)) throw validationError(`\`${data.category}\` is not a valid category`);
    const { rows } = await query(
      `INSERT INTO products (seller_id, title, slug, description, category, price, images, variants, stock, status,
                             rating, reviews_count, sold_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,'draft'),COALESCE($11::numeric,0),COALESCE($12::int,0),COALESCE($13::int,0))
       RETURNING *`,
      [data.sellerId, String(data.title).trim(), makeSlug(data.title), data.description, data.category,
        Number(data.price), JSON.stringify(data.images || []), JSON.stringify(data.variants || []),
        Number(data.stock || 0), data.status || null, data.rating ?? null, data.reviewsCount ?? null, data.soldCount ?? null]
    );
    return toProduct(rows[0]);
  },

  async update(id, body) {
    const sets = [];
    const params = [id];
    for (const [key, col] of Object.entries(UPDATABLE)) {
      if (body[key] === undefined) continue;
      if (key === "category" && !CATEGORIES.includes(body[key])) throw validationError(`\`${body[key]}\` is not a valid category`);
      params.push(JSON_FIELDS.has(key) ? JSON.stringify(body[key]) : body[key]);
      sets.push(`${col} = $${params.length}`);
    }
    if (body.title !== undefined) {
      params.push(makeSlug(body.title));
      sets.push(`slug = $${params.length}`);
    }
    if (!sets.length) return this.findById(id);
    const { rows } = await query(`UPDATE products SET ${sets.join(", ")} WHERE id = $1 RETURNING *`, params);
    return toProduct(rows[0]);
  },

  async remove(id) {
    await query("DELETE FROM products WHERE id = $1", [id]);
  },

  // Public catalogue search
  async search({ search, category, minPrice, maxPrice, rating, sort, limit, offset }) {
    const where = ["p.status = 'active'"];
    const params = [];
    if (search) { params.push(`%${search}%`); where.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`); }
    if (category) { params.push(category); where.push(`p.category = $${params.length}`); }
    if (minPrice) { params.push(Number(minPrice)); where.push(`p.price >= $${params.length}`); }
    if (maxPrice) { params.push(Number(maxPrice)); where.push(`p.price <= $${params.length}`); }
    if (rating) { params.push(Number(rating)); where.push(`p.rating >= $${params.length}`); }
    const clause = `WHERE ${where.join(" AND ")}`;
    const orderBy = SORTS[sort] || SORTS["-createdAt"];
    const total = (await query(`SELECT count(*) FROM products p ${clause}`, params)).rows[0].count;
    const { rows } = await query(
      `${SELECT_WITH_SELLER} ${clause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { products: rows.map(withSeller), total };
  },

  async listBySeller(sellerId, { status, limit, offset } = {}) {
    const params = [sellerId];
    let clause = "WHERE seller_id = $1";
    if (status) { params.push(status); clause += ` AND status = $${params.length}`; }
    const total = (await query(`SELECT count(*) FROM products ${clause}`, params)).rows[0].count;
    let sql = `SELECT * FROM products ${clause} ORDER BY created_at DESC`;
    if (limit) sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset || 0)}`;
    const { rows } = await query(sql, params);
    return { products: rows.map((r) => toProduct(r)), total };
  },

  async count() {
    return (await query("SELECT count(*) FROM products")).rows[0].count;
  },

  // Atomically reserve stock inside a transaction. Returns false if not enough stock.
  // (A single conditional UPDATE prevents overselling even with many app instances.)
  async reserveStock(client, productId, quantity) {
    const { rowCount } = await client.query(
      `UPDATE products SET stock = stock - $2, sold_count = sold_count + $2
       WHERE id = $1 AND stock >= $2`,
      [productId, quantity]
    );
    return rowCount === 1;
  },
};

module.exports = Product;

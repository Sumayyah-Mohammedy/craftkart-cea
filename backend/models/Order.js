// Data access for orders + order_items (PostgreSQL)
const { query } = require("../config/database");
const { toOrder, isUuid, userRef } = require("./mappers");

// Load items for many orders at once, with productId "populated" (title, images)
async function loadItems(orderIds, db = { query }) {
  if (!orderIds.length) return {};
  const { rows } = await db.query(
    `SELECT oi.*, p.title AS p_title, p.images AS p_images
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ANY($1::uuid[])
     ORDER BY oi.id`,
    [orderIds]
  );
  const byOrder = {};
  for (const r of rows) {
    (byOrder[r.order_id] ||= []).push({
      _id: r.id,
      productId: r.product_id ? { _id: r.product_id, title: r.p_title, images: r.p_images || [] } : null,
      sellerId: r.seller_id,
      title: r.title,
      image: r.image,
      variantSku: r.variant_sku || undefined,
      quantity: r.quantity,
      price: r.price,
    });
  }
  return byOrder;
}

const BUYER_JOIN = `
  SELECT o.*, u.id AS b_id, u.name AS b_name, u.email AS b_email, u.phone AS b_phone
  FROM orders o LEFT JOIN users u ON u.id = o.buyer_id`;

async function hydrate(rows, { populateBuyer = false } = {}, db) {
  const items = await loadItems(rows.map((r) => r.id), db);
  return rows.map((r) =>
    toOrder(r, {
      items: items[r.id] || [],
      ...(populateBuyer ? { buyer: userRef(r, "b_", ["name", "email", "phone"]) } : {}),
    })
  );
}

const SHIPPING_COST = 200; // fixed for demo (same as original app)
const TAX_RATE = 0.17;     // 17% GST

const Order = {
  SHIPPING_COST,
  TAX_RATE,

  totals(subtotal) {
    const tax = subtotal * TAX_RATE;
    return { subtotal, shippingCost: SHIPPING_COST, tax, totalAmount: subtotal + SHIPPING_COST + tax };
  },

  // Must be called inside a transaction (client) together with stock reservation
  async create(client, o) {
    const { rows } = await client.query(
      `INSERT INTO orders (buyer_id, shipping_address, subtotal, shipping_cost, tax, total_amount,
                           payment_method, payment_status, order_status, status_history,
                           estimated_delivery, stripe_session_id, stripe_payment_intent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10,$11,$12) RETURNING *`,
      [o.buyerId, JSON.stringify(o.shippingAddress || {}), o.subtotal, o.shippingCost, o.tax, o.totalAmount,
        o.paymentMethod, o.paymentStatus,
        JSON.stringify([{ status: "pending", timestamp: new Date().toISOString() }]),
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), o.stripeSessionId || null, o.stripePaymentIntentId || null]
    );
    const order = rows[0];
    for (const it of o.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, title, image, variant_sku, quantity, price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, it.productId, it.sellerId, it.title, it.image || null, it.variantSku || null, it.quantity, it.price]
      );
    }
    return (await hydrate([order], {}, client))[0];
  },

  async findById(id, { populateBuyer = false } = {}) {
    if (!isUuid(String(id))) return null;
    const { rows } = await query(`${BUYER_JOIN} WHERE o.id = $1`, [id]);
    if (!rows[0]) return null;
    return (await hydrate(rows, { populateBuyer }))[0];
  },

  async findByStripeSession(sessionId) {
    const { rows } = await query("SELECT id FROM orders WHERE stripe_session_id = $1", [sessionId]);
    return rows[0] ? { _id: rows[0].id } : null;
  },

  async listByBuyer(buyerId, { status, limit, offset }) {
    const params = [buyerId];
    let clause = "WHERE o.buyer_id = $1";
    if (status) { params.push(status); clause += ` AND o.order_status = $${params.length}`; }
    const total = (await query(`SELECT count(*) FROM orders o ${clause}`, params)).rows[0].count;
    const { rows } = await query(
      `${BUYER_JOIN} ${clause} ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { orders: await hydrate(rows), total };
  },

  // Orders that contain at least one item sold by this seller
  async listBySeller(sellerId, { status, limit, offset } = {}) {
    const params = [sellerId];
    let clause = "WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.seller_id = $1)";
    if (status) { params.push(status); clause += ` AND o.order_status = $${params.length}`; }
    const total = (await query(`SELECT count(*) FROM orders o ${clause}`, params)).rows[0].count;
    let sql = `${BUYER_JOIN} ${clause} ORDER BY o.created_at DESC`;
    if (limit) sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset || 0)}`;
    const { rows } = await query(sql, params);
    return { orders: await hydrate(rows, { populateBuyer: true }), total };
  },

  async updateStatus(id, status, note) {
    const entry = { status, timestamp: new Date().toISOString(), ...(note ? { note } : {}) };
    const { rows } = await query(
      `UPDATE orders SET
         order_status   = $2,
         status_history = status_history || $3::jsonb,
         delivered_at   = CASE WHEN $2 = 'delivered' THEN now() ELSE delivered_at END,
         cancelled_at   = CASE WHEN $2 = 'cancelled' THEN now() ELSE cancelled_at END
       WHERE id = $1 RETURNING *`,
      [id, status, JSON.stringify([entry])]
    );
    return rows[0] ? (await hydrate(rows))[0] : null;
  },

  async count() {
    return (await query("SELECT count(*) FROM orders")).rows[0].count;
  },

  async totalRevenue() {
    return (await query("SELECT COALESCE(sum(total_amount),0) AS s FROM orders")).rows[0].s;
  },
};

module.exports = Order;

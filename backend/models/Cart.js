// Data access for carts (PostgreSQL). One cart per user; items in cart_items.
const { query } = require("../config/database");
const { isUuid } = require("./mappers");

async function ensureCart(userId, db = { query }) {
  const { rows } = await db.query(
    `INSERT INTO carts (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return rows[0];
}

// Return the cart in the same shape the frontend expects from the old
// Mongoose populate("items.productId", "title price images stock status")
async function getPopulated(userId, db = { query }) {
  const cart = await ensureCart(userId, db);
  const { rows } = await db.query(
    `SELECT ci.id, ci.variant_sku, ci.quantity,
            p.id AS p_id, p.title, p.price, p.images, p.stock, p.status, p.seller_id,
            u.name AS seller_name
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN users u ON u.id = p.seller_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at`,
    [cart.id]
  );
  const items = rows.map((r) => ({
    _id: r.id,
    productId: {
      _id: r.p_id,
      title: r.title,
      price: r.price,
      images: r.images || [],
      stock: r.stock,
      status: r.status,
      sellerId: { _id: r.seller_id, name: r.seller_name },
    },
    variantSku: r.variant_sku || undefined,
    quantity: r.quantity,
  }));
  return {
    _id: cart.id,
    userId: cart.user_id,
    items,
    totalItems: items.reduce((t, i) => t + i.quantity, 0),
    createdAt: cart.created_at,
    updatedAt: cart.updated_at,
  };
}

const Cart = {
  ensureCart,
  getPopulated,

  async addItem(userId, productId, variantSku, quantity) {
    const cart = await ensureCart(userId);
    const existing = await query(
      `SELECT id FROM cart_items WHERE cart_id = $1 AND product_id = $2
       AND variant_sku IS NOT DISTINCT FROM $3`,
      [cart.id, productId, variantSku || null]
    );
    if (existing.rows[0]) {
      await query("UPDATE cart_items SET quantity = quantity + $2 WHERE id = $1", [existing.rows[0].id, quantity]);
    } else {
      await query(
        "INSERT INTO cart_items (cart_id, product_id, variant_sku, quantity) VALUES ($1,$2,$3,$4)",
        [cart.id, productId, variantSku || null, quantity]
      );
    }
    await query("UPDATE carts SET updated_at = now() WHERE id = $1", [cart.id]);
  },

  // Returns false when the item does not belong to this user's cart
  async setItemQuantity(userId, itemId, quantity) {
    if (!isUuid(String(itemId))) return false;
    const owned = await query(
      `SELECT ci.id FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
       WHERE ci.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );
    if (!owned.rows[0]) return false;
    if (quantity <= 0) await query("DELETE FROM cart_items WHERE id = $1", [itemId]);
    else await query("UPDATE cart_items SET quantity = $2 WHERE id = $1", [itemId, quantity]);
    return true;
  },

  async removeItem(userId, itemId) {
    if (!isUuid(String(itemId))) return;
    await query(
      `DELETE FROM cart_items ci USING carts c
       WHERE ci.cart_id = c.id AND ci.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );
  },

  async clear(userId, db = { query }) {
    await db.query(
      "DELETE FROM cart_items ci USING carts c WHERE ci.cart_id = c.id AND c.user_id = $1",
      [userId]
    );
  },

  async exists(userId) {
    const { rows } = await query("SELECT 1 FROM carts WHERE user_id = $1", [userId]);
    return rows.length > 0;
  },
};

module.exports = Cart;

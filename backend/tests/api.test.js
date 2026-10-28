/**
 * Integration tests: run the real Express app against a real PostgreSQL database.
 * CI (GitHub Actions) starts a postgres:16 service container for this.
 * Locally:  DATABASE_URL=postgres://user:pass@localhost:5432/craftkart_test npm test
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const request = require("supertest");
const app = require("../app");
const { pool, migrate, query } = require("../config/database");
const User = require("../models/User");

let buyerToken, sellerToken, adminToken, productId, sellerProfileId, orderId, cartItemId;

const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  await migrate();
  await query("TRUNCATE reviews, order_items, orders, cart_items, carts, products, seller_profiles, users CASCADE");
  await User.create({ name: "Admin", email: "admin@test.com", password: "Admin@123", role: "admin", isVerified: true });
});

afterAll(async () => {
  await pool.end();
});

describe("health", () => {
  test("liveness", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });
  test("readiness checks the database", async () => {
    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.database).toBe("connected");
  });
});

describe("auth", () => {
  test("register buyer", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ name: "Bob", email: "Bob@Test.com", password: "secret1", phone: "03123456789" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("bob@test.com");
    expect(res.body.data.user._id).toBeDefined();
    buyerToken = res.body.data.token;
  });

  test("duplicate email rejected", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "B", email: "bob@test.com", password: "secret1" });
    expect(res.status).toBe(400);
  });

  test("cannot self-register as admin", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Eve", email: "eve@test.com", password: "secret1", role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("buyer");
  });

  test("validation errors return 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "X", email: "not-an-email", password: "1" });
    expect(res.status).toBe(400);
  });

  test("register seller and login admin", async () => {
    const s = await request(app).post("/api/auth/register").send({ name: "Sara", email: "sara@test.com", password: "secret1", role: "seller" });
    expect(s.body.data.user.role).toBe("seller");
    sellerToken = s.body.data.token;

    const a = await request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "Admin@123" });
    expect(a.status).toBe(200);
    adminToken = a.body.data.token;
  });

  test("wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "nope" });
    expect(res.status).toBe(401);
  });

  test("me + profile update never expose password", async () => {
    const res = await request(app).put("/api/auth/profile").set(auth(buyerToken))
      .send({ addresses: [{ street: "1 Main", city: "Karachi", isDefault: true }] });
    expect(res.status).toBe(200);
    expect(res.body.data.user.addresses[0]._id).toBeDefined();
    const me = await request(app).get("/api/auth/me").set(auth(buyerToken));
    expect(me.body.data.user.password).toBeUndefined();
  });

  test("protected route without token", async () => {
    expect((await request(app).get("/api/cart")).status).toBe(401);
  });
});

describe("seller verification + admin", () => {
  test("seller submits verification, admin approves", async () => {
    const v = await request(app).post("/api/seller/verify").set(auth(sellerToken))
      .send({ businessName: "Sara Crafts", cnic: "12345-1234567-1", cnicImages: ["https://x/a.png"], selfie: "https://x/s.png" });
    expect(v.status).toBe(200);

    const pending = await request(app).get("/api/admin/verifications").set(auth(adminToken));
    expect(pending.body.data.profiles).toHaveLength(1);
    expect(pending.body.data.profiles[0].userId.name).toBe("Sara");
    sellerProfileId = pending.body.data.profiles[0]._id;

    const ok = await request(app).put(`/api/admin/verifications/${sellerProfileId}/approve`).set(auth(adminToken));
    expect(ok.body.data.profile.verificationStatus).toBe("approved");
  });

  test("buyer cannot use admin API", async () => {
    expect((await request(app).get("/api/admin/users").set(auth(buyerToken))).status).toBe(403);
  });
});

describe("products", () => {
  test("seller creates product", async () => {
    const res = await request(app).post("/api/products").set(auth(sellerToken)).send({
      title: "Clay Mug", description: "Handmade mug", category: "Kitchenware", price: 1500,
      images: ["https://x/mug.png"], stock: 5, status: "active",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.product.slug).toMatch(/^clay-mug-/);
    productId = res.body.data.product._id;
  });

  test("invalid category rejected", async () => {
    const res = await request(app).post("/api/products").set(auth(sellerToken))
      .send({ title: "X", description: "Y", category: "Cars", price: 1 });
    expect(res.status).toBe(400);
  });

  test("buyer cannot create products", async () => {
    expect((await request(app).post("/api/products").set(auth(buyerToken)).send({})).status).toBe(403);
  });

  test("public listing, search, sort and detail", async () => {
    const list = await request(app).get("/api/products?search=clay&sort=-price");
    expect(list.body.data.products).toHaveLength(1);
    expect(list.body.data.products[0].sellerId.name).toBe("Sara");
    expect(list.body.data.pagination.total).toBe(1);

    const one = await request(app).get(`/api/products/${productId}`);
    expect(one.body.data.product.title).toBe("Clay Mug");
    expect((await request(app).get("/api/products/not-a-uuid")).status).toBe(404);
  });

  test("seller updates own product", async () => {
    const res = await request(app).put(`/api/products/${productId}`).set(auth(sellerToken)).send({ price: 1000 });
    expect(res.body.data.product.price).toBe(1000);
    const mine = await request(app).get("/api/products/seller/my-products").set(auth(sellerToken));
    expect(mine.body.data.products).toHaveLength(1);
  });
});

describe("cart and orders", () => {
  test("add to cart (merges same product)", async () => {
    await request(app).post("/api/cart").set(auth(buyerToken)).send({ productId, quantity: 1 });
    const res = await request(app).post("/api/cart").set(auth(buyerToken)).send({ productId, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.items[0].quantity).toBe(2);
    expect(res.body.data.cart.items[0].productId.title).toBe("Clay Mug");
    cartItemId = res.body.data.cart.items[0]._id;
  });

  test("update cart item quantity", async () => {
    const res = await request(app).put(`/api/cart/${cartItemId}`).set(auth(buyerToken)).send({ quantity: 3 });
    expect(res.body.data.cart.items[0].quantity).toBe(3);
  });

  test("cannot order more than stock", async () => {
    const res = await request(app).post("/api/orders").set(auth(buyerToken))
      .send({ items: [{ productId, quantity: 99 }], paymentMethod: "cod", shippingAddress: {} });
    expect(res.status).toBe(400);
    const p = await request(app).get(`/api/products/${productId}`);
    expect(p.body.data.product.stock).toBe(5); // transaction rolled back
  });

  test("place COD order: totals, stock decrement, cart cleared", async () => {
    const res = await request(app).post("/api/orders").set(auth(buyerToken)).send({
      items: [{ productId, quantity: 3 }], paymentMethod: "cod",
      shippingAddress: { street: "1 Main", city: "Karachi" },
    });
    expect(res.status).toBe(201);
    const o = res.body.data.order;
    orderId = o._id;
    expect(o.orderId).toMatch(/^ORD-\d{4}-\d{6}$/);
    expect(o.subtotal).toBe(3000);
    expect(o.totalAmount).toBeCloseTo(3000 + 200 + 510);
    expect(o.paymentStatus).toBe("pending");

    const p = await request(app).get(`/api/products/${productId}`);
    expect(p.body.data.product.stock).toBe(2);
    expect(p.body.data.product.soldCount).toBe(3);

    const cart = await request(app).get("/api/cart").set(auth(buyerToken));
    expect(cart.body.data.cart.items).toHaveLength(0);
  });

  test("buying the last units marks product out of stock", async () => {
    await request(app).post("/api/orders").set(auth(buyerToken))
      .send({ items: [{ productId, quantity: 2 }], paymentMethod: "cod", shippingAddress: {} });
    const p = await request(app).get(`/api/products/${productId}`);
    expect(p.body.data.product.status).toBe("outofstock");
  });

  test("buyer lists and views orders", async () => {
    const list = await request(app).get("/api/orders").set(auth(buyerToken));
    expect(list.body.data.orders).toHaveLength(2);
    const one = await request(app).get(`/api/orders/${orderId}`).set(auth(buyerToken));
    expect(one.body.data.order.buyerId.name).toBe("Bob");
    expect(one.body.data.order.items[0].productId.title).toBe("Clay Mug");
  });

  test("seller sees the order and updates status", async () => {
    const orders = await request(app).get("/api/seller/orders").set(auth(sellerToken));
    expect(orders.body.data.orders).toHaveLength(2);
    const res = await request(app).put(`/api/seller/orders/${orderId}/status`).set(auth(sellerToken)).send({ status: "shipped", note: "TCS" });
    expect(res.body.data.order.orderStatus).toBe("shipped");
    expect(res.body.data.order.statusHistory).toHaveLength(2);

    const bad = await request(app).put(`/api/seller/orders/${orderId}/status`).set(auth(sellerToken)).send({ status: "teleported" });
    expect(bad.status).toBe(400);

    const dash = await request(app).get("/api/seller/dashboard").set(auth(sellerToken));
    expect(dash.body.data.analytics.orders.total).toBe(2);
    expect(dash.body.data.analytics.revenue.total).toBe(5000);
  });

  test("admin analytics", async () => {
    const res = await request(app).get("/api/admin/analytics").set(auth(adminToken));
    expect(res.body.data).toMatchObject({ users: 4, products: 1, orders: 2, sellers: 1 });
  });

  test("admin suspends a user, who is then blocked", async () => {
    const users = await request(app).get("/api/admin/users?search=bob").set(auth(adminToken));
    const bob = users.body.data.users[0];
    await request(app).put(`/api/admin/users/${bob._id}/suspend`).set(auth(adminToken)).send({ suspend: true });
    expect((await request(app).get("/api/cart").set(auth(buyerToken))).status).toBe(403);
  });

  test("card checkout reports 503 when Stripe is not configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await request(app).post("/api/orders/create-stripe-session").set(auth(sellerToken));
    expect(res.status).toBe(503);
  });
});

// PURPOSE: Create demo data (admin, sellers, buyers, products, orders) in PostgreSQL
//   node scripts/seedData.js          -> seed only if the database is empty
//   node scripts/seedData.js --reset  -> wipe all tables first
// Admin credentials can be overridden with ADMIN_EMAIL / ADMIN_PASSWORD.
require("dotenv").config();

const { pool, query, connectDB, withTransaction } = require("../config/database");
const User = require("../models/User");
const Product = require("../models/Product");
const SellerProfile = require("../models/SellerProfile");
const Order = require("../models/Order");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@craftkart.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";

const CATEGORIES = Product.CATEGORIES;
const IMAGES = {
  Fashion: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600",
  Kitchenware: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600",
  Accessories: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600",
  "Home Decor": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600",
  Jewellery: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600",
  "Personal Care": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600",
  Stationary: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600",
  Others: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600",
};

async function seed() {
  const reset = process.argv.includes("--reset");
  await connectDB();

  if (reset) {
    console.log("Clearing existing data...");
    await query("TRUNCATE reviews, order_items, orders, cart_items, carts, products, seller_profiles, users CASCADE");
  } else {
    const { rows } = await query("SELECT count(*) FROM users");
    if (rows[0].count > 0) {
      console.log("Database already has data - skipping (use --reset to wipe and reseed).");
      return;
    }
  }

  const admin = await User.create({ name: "Admin User", email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "admin", isVerified: true });
  console.log(`Admin created: ${admin.email}`);

  const buyers = [];
  for (let i = 1; i <= 5; i++) {
    buyers.push(await User.create({
      name: `Buyer ${i}`, email: `buyer${i}@example.com`, password: "Buyer@123", role: "buyer",
      phone: `0312345678${i % 10}`,
      addresses: [{ street: `House ${i * 10}, Street ${i}`, city: "Karachi", state: "Sindh", postalCode: "75500", country: "Pakistan", isDefault: true }],
    }));
  }

  const sellers = [];
  for (let i = 1; i <= 10; i++) {
    const verified = i <= 7;
    const seller = await User.create({
      name: `Seller ${i}`, email: `seller${i}@example.com`, password: "Seller@123", role: "seller",
      phone: `0323456789${i % 10}`, isVerified: verified,
    });
    sellers.push(seller);
    await SellerProfile.upsert(seller._id, {
      businessName: `Craft Studio ${i}`,
      cnic: `12345-${String(i).padStart(7, "0")}-1`,
      shopDescription: `Handmade goods from Seller ${i}`,
      verificationStatus: verified ? "approved" : "pending",
      verifiedAt: verified ? new Date() : null,
      rating: 4 + Math.random(), totalSales: Math.floor(Math.random() * 100), totalRevenue: Math.floor(Math.random() * 100000),
    });
    if (verified) await query("UPDATE seller_profiles SET verification_status='approved', verified_at=now() WHERE user_id=$1", [seller._id]);
  }

  const products = [];
  const verifiedSellers = sellers.slice(0, 7);
  for (let i = 0; i < 40; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const price = 500 + Math.floor(Math.random() * 5000);
    products.push(await Product.create({
      sellerId: verifiedSellers[i % verifiedSellers.length]._id,
      title: `Handmade ${category} Item ${i + 1}`,
      description: `Beautiful ${category.toLowerCase()} piece made with care. High quality and excellent craftsmanship.`,
      category, price, images: [IMAGES[category]],
      variants: [
        { sku: `SKU-${i}-S`, size: "Small", color: "Red", price, stock: 20 },
        { sku: `SKU-${i}-M`, size: "Medium", color: "Blue", price: price + 200, stock: 20 },
      ],
      stock: Math.floor(Math.random() * 100) + 20,
      rating: Math.round((3 + Math.random() * 2) * 100) / 100,
      reviewsCount: Math.floor(Math.random() * 20),
      soldCount: Math.floor(Math.random() * 50),
      status: "active",
    }));
  }

  for (let i = 0; i < 15; i++) {
    const buyer = buyers[i % buyers.length];
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    await withTransaction((client) => Order.create(client, {
      buyerId: buyer._id,
      items: [{ productId: product._id, sellerId: product.sellerId, title: product.title, image: product.images[0], quantity, price: product.price }],
      shippingAddress: buyer.addresses[0],
      ...Order.totals(product.price * quantity),
      paymentMethod: Math.random() > 0.5 ? "card" : "cod",
      paymentStatus: "completed",
    }));
  }

  console.log(`Seeded: 1 admin, ${buyers.length} buyers, ${sellers.length} sellers, ${products.length} products, 15 orders`);
  console.log("Demo accounts:");
  console.log(`  Admin:   ${ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD ? "(from ADMIN_PASSWORD)" : ADMIN_PASSWORD}`);
  console.log("  Sellers: seller1@example.com .. seller7@example.com / Seller@123");
  console.log("  Buyers:  buyer1@example.com .. buyer5@example.com / Buyer@123");
}

seed()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("Seed error:", err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  });

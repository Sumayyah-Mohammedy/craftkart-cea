// ============================================
// Row -> API object mappers.
// The React frontend was written against Mongoose documents, so the API keeps
// the same JSON shape: `_id`, camelCase fields, and "populated" references
// (e.g. product.sellerId = { _id, name, email }).
// ============================================
const crypto = require("crypto");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === "string" && UUID_RE.test(v);

// Sub-documents in Mongoose had their own _id; keep that for addresses etc.
const withIds = (arr) =>
  (Array.isArray(arr) ? arr : []).map((o) =>
    o && typeof o === "object" && !o._id ? { _id: crypto.randomUUID(), ...o } : o
  );

function toUser(r, { withPassword = false } = {}) {
  if (!r) return null;
  const u = {
    _id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    phone: r.phone || undefined,
    addresses: r.addresses || [],
    isVerified: r.is_verified,
    isSuspended: r.is_suspended,
    profileImage: r.profile_image || undefined,
    wishlist: r.wishlist || [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
  if (withPassword) u.password = r.password;
  return u;
}

// Small "populated" user reference, built from prefixed join columns
function userRef(r, prefix, fields = ["name", "email"]) {
  if (!r[`${prefix}id`]) return r[`${prefix}id`] ?? null;
  const ref = { _id: r[`${prefix}id`] };
  for (const f of fields) ref[f] = r[`${prefix}${f}`];
  return ref;
}

function toProduct(r, { seller } = {}) {
  if (!r) return null;
  return {
    _id: r.id,
    sellerId: seller !== undefined ? seller : r.seller_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    category: r.category,
    price: r.price,
    images: r.images || [],
    variants: r.variants || [],
    stock: r.stock,
    rating: r.rating,
    reviewsCount: r.reviews_count,
    soldCount: r.sold_count,
    status: r.status,
    features: r.features || [],
    tags: r.tags || [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toSellerProfile(r, { user } = {}) {
  if (!r) return null;
  return {
    _id: r.id,
    userId: user !== undefined ? user : r.user_id,
    businessName: r.business_name,
    cnic: r.cnic,
    cnicImages: r.cnic_images || [],
    selfieImage: r.selfie_image || undefined,
    businessDocuments: r.business_documents || [],
    shopDescription: r.shop_description || undefined,
    bankDetails: r.bank_details || undefined,
    verificationStatus: r.verification_status,
    verifiedAt: r.verified_at || undefined,
    rejectionReason: r.rejection_reason || undefined,
    rating: r.rating,
    totalSales: r.total_sales,
    totalRevenue: r.total_revenue,
    totalProducts: r.total_products,
    responseTime: r.response_time || undefined,
    shippingPolicy: r.shipping_policy || undefined,
    returnPolicy: r.return_policy || undefined,
    socialLinks: r.social_links || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toOrder(r, { items = [], buyer } = {}) {
  if (!r) return null;
  return {
    _id: r.id,
    orderId: r.order_id,
    buyerId: buyer !== undefined ? buyer : r.buyer_id,
    items,
    shippingAddress: r.shipping_address || {},
    subtotal: r.subtotal,
    shippingCost: r.shipping_cost,
    tax: r.tax,
    totalAmount: r.total_amount,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    orderStatus: r.order_status,
    statusHistory: r.status_history || [],
    trackingNumber: r.tracking_number || undefined,
    estimatedDelivery: r.estimated_delivery || undefined,
    deliveredAt: r.delivered_at || undefined,
    cancelledAt: r.cancelled_at || undefined,
    cancellationReason: r.cancellation_reason || undefined,
    stripeSessionId: r.stripe_session_id || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function pagination(page, limit, total) {
  return { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) };
}

// Parse ?page & ?limit safely (bounded to avoid huge scans)
function pageParams(q, defLimit = 20) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || defLimit));
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = { isUuid, withIds, toUser, userRef, toProduct, toSellerProfile, toOrder, pagination, pageParams };

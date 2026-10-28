// Data access for seller verification profiles (PostgreSQL)
const { query } = require("../config/database");
const { toSellerProfile, isUuid, userRef } = require("./mappers");

const SellerProfile = {
  async findById(id) {
    if (!isUuid(String(id))) return null;
    const { rows } = await query("SELECT * FROM seller_profiles WHERE id = $1", [id]);
    return toSellerProfile(rows[0]);
  },

  // Insert or update the caller's profile and reset it to "pending"
  async upsert(userId, p) {
    if (!p.businessName || !p.cnic) {
      const e = new Error("businessName and cnic are required");
      e.name = "ValidationError";
      e.statusCode = 400;
      throw e;
    }
    const { rows } = await query(
      `INSERT INTO seller_profiles (user_id, business_name, cnic, cnic_images, selfie_image, shop_description,
                                    bank_details, verification_status, verified_at, rating, total_sales, total_revenue)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,'pending'),$9,COALESCE($10::numeric,0),COALESCE($11::int,0),COALESCE($12::numeric,0))
       ON CONFLICT (user_id) DO UPDATE SET
         business_name       = EXCLUDED.business_name,
         cnic                = EXCLUDED.cnic,
         cnic_images         = CASE WHEN jsonb_array_length(EXCLUDED.cnic_images) > 0
                                    THEN EXCLUDED.cnic_images ELSE seller_profiles.cnic_images END,
         selfie_image        = COALESCE(EXCLUDED.selfie_image, seller_profiles.selfie_image),
         shop_description    = EXCLUDED.shop_description,
         bank_details        = EXCLUDED.bank_details,
         verification_status = 'pending'
       RETURNING *`,
      [userId, p.businessName, p.cnic, JSON.stringify(p.cnicImages || []), p.selfieImage || null,
        p.shopDescription || null, p.bankDetails ? JSON.stringify(p.bankDetails) : null,
        p.verificationStatus || null, p.verifiedAt || null, p.rating ?? null, p.totalSales ?? null, p.totalRevenue ?? null]
    );
    return toSellerProfile(rows[0]);
  },

  async listPending() {
    const { rows } = await query(
      `SELECT sp.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.phone AS u_phone
       FROM seller_profiles sp LEFT JOIN users u ON u.id = sp.user_id
       WHERE sp.verification_status = 'pending'
       ORDER BY sp.created_at DESC`
    );
    return rows.map((r) => toSellerProfile(r, { user: userRef(r, "u_", ["name", "email", "phone"]) }));
  },

  async setStatus(id, status, { reason } = {}) {
    const { rows } = await query(
      `UPDATE seller_profiles SET
         verification_status = $2,
         verified_at      = CASE WHEN $2 = 'approved' THEN now() ELSE verified_at END,
         rejection_reason = CASE WHEN $2 = 'rejected' THEN $3 ELSE rejection_reason END
       WHERE id = $1 RETURNING *`,
      [id, status, reason || null]
    );
    return toSellerProfile(rows[0]);
  },
};

module.exports = SellerProfile;

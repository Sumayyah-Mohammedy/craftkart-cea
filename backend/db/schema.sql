-- CraftKart PostgreSQL schema (idempotent: safe to run on every start-up)
-- Nested/variable-shaped data (addresses, variants, status history...) uses JSONB;
-- relationships that are queried or joined (cart items, order items) are real tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- keeps updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password      text NOT NULL,
  role          text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  phone         text,
  addresses     jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_verified   boolean NOT NULL DEFAULT false,
  is_suspended  boolean NOT NULL DEFAULT false,
  profile_image text,
  wishlist      uuid[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name       text NOT NULL,
  cnic                text NOT NULL,
  cnic_images         jsonb NOT NULL DEFAULT '[]'::jsonb,
  selfie_image        text,
  business_documents  jsonb NOT NULL DEFAULT '[]'::jsonb,
  shop_description    text,
  bank_details        jsonb,
  verification_status text NOT NULL DEFAULT 'pending'
                      CHECK (verification_status IN ('pending','approved','rejected')),
  verified_at         timestamptz,
  rejection_reason    text,
  rating              numeric(3,2) NOT NULL DEFAULT 0,
  total_sales         integer NOT NULL DEFAULT 0,
  total_revenue       numeric(14,2) NOT NULL DEFAULT 0,
  total_products      integer NOT NULL DEFAULT 0,
  response_time       text,
  shipping_policy     text,
  return_policy       text,
  social_links        jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text NOT NULL,
  category      text NOT NULL CHECK (category IN ('Fashion','Kitchenware','Accessories','Home Decor',
                                                  'Jewellery','Personal Care','Stationary','Others')),
  price         numeric(12,2) NOT NULL CHECK (price >= 0),
  images        jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants      jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock         integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating        numeric(3,2) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  reviews_count integer NOT NULL DEFAULT 0,
  sold_count    integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','inactive','outofstock')),
  features      jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- Same rule the old Mongoose pre-save hook enforced: zero stock => out of stock
CREATE OR REPLACE FUNCTION product_stock_status() RETURNS trigger AS $$
BEGIN
  IF NEW.stock = 0 THEN
    NEW.status := 'outofstock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS carts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_sku text,
  quantity    integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items (cart_id);

CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE TABLE IF NOT EXISTS orders (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                 text NOT NULL UNIQUE
                           DEFAULT ('ORD-' || to_char(now(), 'YYYY') || '-' ||
                                    lpad(nextval('order_number_seq')::text, 6, '0')),
  buyer_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shipping_address         jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal                 numeric(12,2) NOT NULL,
  shipping_cost            numeric(12,2) NOT NULL DEFAULT 0,
  tax                      numeric(12,2) NOT NULL DEFAULT 0,
  total_amount             numeric(12,2) NOT NULL,
  payment_method           text NOT NULL CHECK (payment_method IN ('card','cod','jazzcash','easypaisa')),
  payment_status           text NOT NULL DEFAULT 'pending'
                           CHECK (payment_status IN ('pending','completed','failed','refunded')),
  order_status             text NOT NULL DEFAULT 'pending'
                           CHECK (order_status IN ('pending','confirmed','packed','shipped','delivered','cancelled')),
  status_history           jsonb NOT NULL DEFAULT '[]'::jsonb,
  tracking_number          text,
  estimated_delivery       timestamptz,
  delivered_at             timestamptz,
  cancelled_at             timestamptz,
  cancellation_reason      text,
  stripe_session_id        text UNIQUE,
  stripe_payment_intent_id text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders (buyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  seller_id   uuid NOT NULL REFERENCES users(id),
  title       text,
  image       text,
  variant_sku text,
  quantity    integer NOT NULL CHECK (quantity >= 1),
  price       numeric(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items (seller_id);

CREATE TABLE IF NOT EXISTS reviews (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id             uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating               integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                text,
  comment              text NOT NULL,
  images               jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  helpful_count        integer NOT NULL DEFAULT 0,
  seller_response      jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- (Re)create triggers so this file stays idempotent
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','seller_profiles','products','carts','orders','reviews'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$s
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_products_stock_status ON products;
CREATE TRIGGER trg_products_stock_status BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION product_stock_status();

-- ============================================================
-- Migration 001 — Initial Schema
-- Laundry Palu — PostgreSQL 15+
-- Tables in FK dependency order (parents before children)
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,   -- bcrypt cost 12
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kasir')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  alamat      TEXT,
  no_hp       VARCHAR(20) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MEMBERSHIPS
-- ─────────────────────────────────────────────
CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  tipe            VARCHAR(20) NOT NULL CHECK (tipe IN ('periodik', 'paket_kg')),
  -- Periodik fields
  durasi_bulan    INTEGER,              -- 3, 6, or 12
  tanggal_mulai   DATE,
  tanggal_selesai DATE,
  -- Paket Kg fields
  paket_kg        DECIMAL(10,2),        -- 50, 100, 200
  sisa_kg         DECIMAL(10,2),
  -- common
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ITEMS (laundry services)
-- ─────────────────────────────────────────────
CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  tipe        VARCHAR(20) NOT NULL CHECK (tipe IN ('satuan', 'kiloan', 'jasa_lain')),
  harga       BIGINT NOT NULL,          -- IDR in whole rupiah
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INVENTORY ITEMS
-- (defined before expenses because expenses.inventory_item_id → inventory_items.id)
-- ─────────────────────────────────────────────
CREATE TABLE inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            VARCHAR(100) NOT NULL,
  satuan          VARCHAR(30) NOT NULL,  -- pcs, liter, kg, etc.
  qty_saat_ini    DECIMAL(10,2) DEFAULT 0,
  harga_rata_fifo BIGINT DEFAULT 0,
  stok_minimum    DECIMAL(10,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXPENSE CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE expense_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  level       VARCHAR(20) NOT NULL CHECK (level IN ('variabel', 'tetap')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────
CREATE TABLE expenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal           DATE NOT NULL,
  jumlah            BIGINT NOT NULL,
  category_id       UUID NOT NULL REFERENCES expense_categories(id),
  deskripsi         TEXT,
  inventory_item_id UUID REFERENCES inventory_items(id),  -- optional link
  qty_used          DECIMAL(10,2),
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDERS (invoices)
-- ─────────────────────────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no      VARCHAR(30) UNIQUE NOT NULL, -- INV-YYYYMMDD-NNNN
  customer_id     UUID NOT NULL REFERENCES customers(id),
  membership_id   UUID REFERENCES memberships(id),
  diskon_persen   DECIMAL(5,2) DEFAULT 0,
  subtotal        BIGINT NOT NULL,       -- before discount
  diskon_amount   BIGINT DEFAULT 0,
  total           BIGINT NOT NULL,       -- after discount
  status          VARCHAR(30) NOT NULL DEFAULT 'diterima'
                    CHECK (status IN ('diterima','dicuci','dikeringkan',
                                      'dibungkus','siap_diambil','selesai')),
  catatan         TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id),
  nama_item   VARCHAR(100) NOT NULL,    -- snapshot at time of order
  tipe        VARCHAR(20) NOT NULL,     -- snapshot
  harga       BIGINT NOT NULL,          -- snapshot
  qty         DECIMAL(10,2) NOT NULL,   -- units or kg
  subtotal    BIGINT NOT NULL
);

-- ─────────────────────────────────────────────
-- ORDER STATUS HISTORY
-- ─────────────────────────────────────────────
CREATE TABLE order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id),
  status      VARCHAR(30) NOT NULL,
  changed_by  UUID REFERENCES users(id),
  changed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INVENTORY TRANSACTIONS (FIFO ledger)
-- ─────────────────────────────────────────────
CREATE TABLE inventory_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES inventory_items(id),
  tipe            VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
  qty             DECIMAL(10,2) NOT NULL,
  harga_per_unit  BIGINT,              -- for 'masuk' transactions only
  referensi       TEXT,                -- e.g. expense_id or manual note
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_orders_customer      ON orders(customer_id);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_orders_created_at    ON orders(created_at);
CREATE INDEX idx_orders_invoice_no    ON orders(invoice_no);
CREATE INDEX idx_customers_no_hp      ON customers(no_hp);
CREATE INDEX idx_expenses_tanggal     ON expenses(tanggal);
CREATE INDEX idx_inventory_trans_item ON inventory_transactions(item_id);

COMMIT;

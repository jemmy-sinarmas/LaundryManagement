-- ============================================================
-- Migration 001 — Initial Schema (SQLite)
-- Laundry Palu — SQLite 3.x
-- Used for local development and testing only.
-- Production uses 001_init.sql with PostgreSQL.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'kasir')),
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────
CREATE TABLE customers (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  alamat      TEXT,
  no_hp       TEXT UNIQUE NOT NULL,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- MEMBERSHIPS
-- ─────────────────────────────────────────────
CREATE TABLE memberships (
  id              TEXT PRIMARY KEY,
  customer_id     TEXT NOT NULL REFERENCES customers(id),
  tipe            TEXT NOT NULL CHECK (tipe IN ('periodik', 'paket_kg')),
  durasi_bulan    INTEGER,
  tanggal_mulai   TEXT,
  tanggal_selesai TEXT,
  paket_kg        REAL,
  sisa_kg         REAL,
  is_active       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE items (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  tipe        TEXT NOT NULL CHECK (tipe IN ('satuan', 'kiloan', 'jasa_lain')),
  harga       INTEGER NOT NULL,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- INVENTORY ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE inventory_items (
  id              TEXT PRIMARY KEY,
  nama            TEXT NOT NULL,
  satuan          TEXT NOT NULL,
  qty_saat_ini    REAL DEFAULT 0,
  harga_rata_fifo INTEGER DEFAULT 0,
  stok_minimum    REAL DEFAULT 0,
  is_active       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- EXPENSE CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE expense_categories (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  level       TEXT NOT NULL CHECK (level IN ('variabel', 'tetap')),
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────
CREATE TABLE expenses (
  id                TEXT PRIMARY KEY,
  tanggal           TEXT NOT NULL,
  jumlah            INTEGER NOT NULL,
  category_id       TEXT NOT NULL REFERENCES expense_categories(id),
  deskripsi         TEXT,
  inventory_item_id TEXT REFERENCES inventory_items(id),
  qty_used          REAL,
  created_by        TEXT REFERENCES users(id),
  created_at        TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE orders (
  id              TEXT PRIMARY KEY,
  invoice_no      TEXT UNIQUE NOT NULL,
  customer_id     TEXT NOT NULL REFERENCES customers(id),
  membership_id   TEXT REFERENCES memberships(id),
  diskon_persen   REAL DEFAULT 0,
  subtotal        INTEGER NOT NULL,
  diskon_amount   INTEGER DEFAULT 0,
  total           INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'diterima'
                    CHECK (status IN ('diterima','dicuci','dikeringkan',
                                      'dibungkus','siap_diambil','selesai')),
  catatan         TEXT,
  created_by      TEXT REFERENCES users(id),
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE order_items (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL REFERENCES items(id),
  nama_item   TEXT NOT NULL,
  tipe        TEXT NOT NULL,
  harga       INTEGER NOT NULL,
  qty         REAL NOT NULL,
  subtotal    INTEGER NOT NULL
);

-- ─────────────────────────────────────────────
-- ORDER STATUS HISTORY
-- ─────────────────────────────────────────────
CREATE TABLE order_status_history (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id),
  status      TEXT NOT NULL,
  changed_by  TEXT REFERENCES users(id),
  changed_at  TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- INVENTORY TRANSACTIONS
-- ─────────────────────────────────────────────
CREATE TABLE inventory_transactions (
  id              TEXT PRIMARY KEY,
  item_id         TEXT NOT NULL REFERENCES inventory_items(id),
  tipe            TEXT NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
  qty             REAL NOT NULL,
  harga_per_unit  INTEGER,
  referensi       TEXT,
  created_by      TEXT REFERENCES users(id),
  created_at      TEXT DEFAULT (datetime('now'))
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

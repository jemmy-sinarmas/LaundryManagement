-- Migration 016: Payment capture for the daily cash-position report (Laporan Posisi Harian).
-- Adds payment method + amount paid to orders, payment method to expenses, and an
-- opening cash balance setting. Additive / non-destructive only.
-- (Originally drafted as 007_payments.sql on the reconstruction branch; renumbered to 016
--  because upstream already owns slots 007-015.)
BEGIN;

-- Orders: how the customer paid, and how much was actually paid.
-- Per-order receivable (piutang) = total - jumlah_dibayar.
ALTER TABLE orders
  ADD COLUMN metode_pembayaran VARCHAR(20) NOT NULL DEFAULT 'tunai'
    CHECK (metode_pembayaran IN ('tunai', 'qris', 'transfer_bca'));
ALTER TABLE orders
  ADD COLUMN jumlah_dibayar BIGINT NOT NULL DEFAULT 0;

-- Backfill existing orders as fully paid so historical data is not all receivables.
UPDATE orders SET jumlah_dibayar = total;

-- Expenses: cash out vs bank transfer out.
ALTER TABLE expenses
  ADD COLUMN metode_pembayaran VARCHAR(20) NOT NULL DEFAULT 'tunai'
    CHECK (metode_pembayaran IN ('tunai', 'transfer'));

-- Opening cash balance (saldo awal kas) used as the KAS position baseline.
INSERT INTO settings (key, value) VALUES ('saldo_awal_kas', '0')
  ON CONFLICT (key) DO NOTHING;

COMMIT;

-- Migration 003: App settings table
BEGIN;

CREATE TABLE settings (
  key         VARCHAR(50) PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('business_name',    'Laundry Palu'),
  ('business_address', ''),
  ('business_phone',   ''),
  ('invoice_footer',   'Terima kasih telah mempercayakan laundry Anda kepada kami.'),
  ('logo_base64',      '');

COMMIT;

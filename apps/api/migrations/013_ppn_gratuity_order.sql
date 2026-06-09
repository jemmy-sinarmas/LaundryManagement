ALTER TABLE orders
  ADD COLUMN ppn_amount      BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN gratuity_amount BIGINT NOT NULL DEFAULT 0;

INSERT INTO settings (key, value) VALUES
  ('ppn_percent',      '0'),
  ('gratuity_percent', '0')
ON CONFLICT (key) DO NOTHING;

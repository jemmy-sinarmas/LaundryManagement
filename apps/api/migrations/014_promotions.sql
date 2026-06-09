CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            VARCHAR(100) NOT NULL,
  tipe            VARCHAR(10) NOT NULL CHECK (tipe IN ('persen', 'nominal')),
  nilai           BIGINT NOT NULL,
  min_order       BIGINT NOT NULL DEFAULT 0,
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  branch_id       UUID REFERENCES branches(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_branch_id ON promotions(branch_id);
CREATE INDEX idx_promotions_active ON promotions(is_active, tanggal_mulai, tanggal_selesai);

ALTER TABLE orders
  ADD COLUMN promo_id            UUID REFERENCES promotions(id),
  ADD COLUMN promo_diskon_amount BIGINT NOT NULL DEFAULT 0;

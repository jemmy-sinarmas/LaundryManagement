CREATE TABLE shifts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kasir_id    UUID NOT NULL REFERENCES users(id),
  branch_id   UUID NOT NULL REFERENCES branches(id),
  start_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time    TIMESTAMPTZ,
  start_cash  BIGINT NOT NULL DEFAULT 0,
  end_cash    BIGINT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX shifts_kasir_open_idx ON shifts (kasir_id) WHERE end_time IS NULL;

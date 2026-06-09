-- Migration 007: branches table
-- Creates the branches table for multi-outlet support (v1.1)

CREATE TABLE branches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       VARCHAR(100) NOT NULL,
  kode       VARCHAR(10) UNIQUE NOT NULL,
  alamat     TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_kode ON branches(kode);

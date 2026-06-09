-- Migration 008: add branch_id to users
-- NULL = super-admin/full access; UUID = locked to that branch (kasir)

ALTER TABLE users ADD COLUMN branch_id UUID REFERENCES branches(id);

CREATE INDEX idx_users_branch_id ON users(branch_id);

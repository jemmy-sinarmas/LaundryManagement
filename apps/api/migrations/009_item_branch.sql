-- Migration 009: add branch_id to items
-- NULL = legacy/unassigned items (existing seed data); all new items require a branch

ALTER TABLE items ADD COLUMN branch_id UUID REFERENCES branches(id);

CREATE INDEX idx_items_branch_id ON items(branch_id);

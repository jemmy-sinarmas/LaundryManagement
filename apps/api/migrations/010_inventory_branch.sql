-- Migration 010: add branch_id to inventory_items
-- NULL = legacy items; all new inventory items require a branch

ALTER TABLE inventory_items ADD COLUMN branch_id UUID REFERENCES branches(id);

CREATE INDEX idx_inventory_items_branch_id ON inventory_items(branch_id);

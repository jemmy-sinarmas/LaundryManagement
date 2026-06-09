-- Migration 011: add branch_id and pickup_token to orders
-- branch_id NULL = legacy orders; pickup_token UUID = opaque claim ticket for QR validation

ALTER TABLE orders ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE orders ADD COLUMN pickup_token UUID DEFAULT gen_random_uuid();

CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE UNIQUE INDEX idx_orders_pickup_token ON orders(pickup_token);

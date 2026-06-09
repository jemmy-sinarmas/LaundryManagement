-- Migration 005: Add country_code to customers (default Indonesia +62)
BEGIN;
ALTER TABLE customers ADD COLUMN country_code VARCHAR(5) NOT NULL DEFAULT '+62';
COMMIT;

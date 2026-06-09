-- Migration 006: Add foto_referensi to inventory_transactions for bulk purchase photo
BEGIN;
ALTER TABLE inventory_transactions ADD COLUMN foto_referensi TEXT;
COMMIT;

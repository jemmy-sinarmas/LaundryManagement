-- Migration 004: Add catatan (remarks) to order status history for revert feature
BEGIN;
ALTER TABLE order_status_history ADD COLUMN catatan TEXT;
COMMIT;

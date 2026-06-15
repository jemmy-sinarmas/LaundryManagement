-- Migration 018: Notification outbox / audit log.
-- Records every WhatsApp notification attempt (sent, skipped, or failed) so the flow is
-- auditable even while live sending is disabled. Additive / non-destructive only.
BEGIN;

CREATE TABLE notification_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id),
  type        VARCHAR(30) NOT NULL,   -- payment_receipt | ready_for_collection
  to_number   VARCHAR(30) NOT NULL,
  message     TEXT NOT NULL,          -- the rendered body that was sent / would have been sent
  status      VARCHAR(20) NOT NULL,   -- skipped | sent | failed
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_log_order_id ON notification_log(order_id);

COMMIT;

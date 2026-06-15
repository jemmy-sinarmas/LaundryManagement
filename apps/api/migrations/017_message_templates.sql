-- Migration 017: WhatsApp message templates + integration settings.
-- Two admin-editable templates (payment receipt, ready-for-collection) whose header/footer
-- wrap a fixed order-detail body rendered by the backend. Also seeds the scaffold WhatsApp
-- connection settings (disabled by default — the sender logs instead of sending).
-- Additive / non-destructive only.
BEGIN;

CREATE TABLE message_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       VARCHAR(30) UNIQUE NOT NULL
             CHECK (type IN ('payment_receipt', 'ready_for_collection')),
  header     TEXT NOT NULL DEFAULT '',
  footer     TEXT NOT NULL DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default content derived from the sample receipt. Placeholders ({business_name},
-- {business_phone}, ...) are substituted by the backend renderer.
INSERT INTO message_templates (type, header, footer) VALUES
(
  'payment_receipt',
  E'{business_name}\nPalu\n{business_phone}',
  E'🙏Terima kasih telah menggunakan layanan kami!\n\nSyarat & ketentuan keluhan :\nhttps://www.xxx.net/complaint\nJika ada yang bisa kami bantu atau ada yang ingin ditanyakan, mohon hubungi kami di Customer Care\nhttps://wa.me/6281XXXXXXX'
),
(
  'ready_for_collection',
  E'{business_name}\nPalu\n{business_phone}',
  E'🙏Terima kasih telah menggunakan layanan kami!\n\nMohon tunjukkan pesan ini saat pengambilan.'
);

-- Scaffold WhatsApp connection settings (key-value settings table from migration 003).
INSERT INTO settings (key, value) VALUES
  ('whatsapp_enabled',  'false'),
  ('whatsapp_provider', ''),
  ('whatsapp_api_url',  ''),
  ('whatsapp_api_key',  ''),
  ('whatsapp_sender',   '')
ON CONFLICT (key) DO NOTHING;

COMMIT;

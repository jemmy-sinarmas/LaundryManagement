import { randomUUID } from 'node:crypto';
import type { SqlDb } from '../lib/db-types.js';
import type { MessageTemplateType } from '@laundry-palu/shared';
import type { SendStatus } from '../lib/whatsapp/index.js';

type NotificationLogRow = {
  id: string;
  order_id: string | null;
  invoice_no: string | null;
  type: string;
  to_number: string;
  message: string;
  status: string;
  error: string | null;
  created_at: string;
};

export type NotificationLogEntry = {
  id: string;
  orderId: string | null;
  invoiceNo: string | null;
  type: string;
  toNumber: string;
  message: string;
  status: string;
  error: string | null;
  createdAt: string;
};

function mapRow(row: NotificationLogRow): NotificationLogEntry {
  return {
    id: row.id,
    orderId: row.order_id,
    invoiceNo: row.invoice_no,
    type: row.type,
    toNumber: row.to_number,
    message: row.message,
    status: row.status,
    error: row.error,
    createdAt: row.created_at,
  };
}

export async function findAll(db: SqlDb, limit = 200): Promise<NotificationLogEntry[]> {
  const rows = await db<NotificationLogRow>`
    SELECT
      nl.id,
      nl.order_id,
      o.invoice_no,
      nl.type,
      nl.to_number,
      nl.message,
      nl.status,
      nl.error,
      nl.created_at
    FROM notification_log nl
    LEFT JOIN orders o ON o.id = nl.order_id
    ORDER BY nl.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapRow);
}

export async function create(
  db: SqlDb,
  data: {
    orderId: string | null;
    type: MessageTemplateType;
    toNumber: string;
    message: string;
    status: SendStatus;
    error?: string | null;
  }
): Promise<void> {
  await db`
    INSERT INTO notification_log (id, order_id, type, to_number, message, status, error)
    VALUES (${randomUUID()}, ${data.orderId}, ${data.type}, ${data.toNumber},
            ${data.message}, ${data.status}, ${data.error ?? null})
  `;
}

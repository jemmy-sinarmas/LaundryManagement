import { randomUUID } from 'node:crypto';
import type { SqlDb } from '../lib/db-types.js';
import type { MessageTemplateType } from '@laundry-palu/shared';
import type { SendStatus } from '../lib/whatsapp/index.js';

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

import type { MessageTemplate, MessageTemplateType } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type MessageTemplateRow = {
  id: string;
  type: string;
  header: string;
  footer: string;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
};

function mapTemplate(row: MessageTemplateRow): MessageTemplate {
  return {
    id: row.id,
    type: row.type as MessageTemplateType,
    header: row.header,
    footer: row.footer,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(db: SqlDb): Promise<MessageTemplate[]> {
  const rows = await db<MessageTemplateRow>`
    SELECT * FROM message_templates ORDER BY type ASC
  `;
  return rows.map(mapTemplate);
}

export async function findByType(
  db: SqlDb,
  type: MessageTemplateType
): Promise<MessageTemplate | null> {
  const rows = await db<MessageTemplateRow>`
    SELECT * FROM message_templates WHERE type = ${type} LIMIT 1
  `;
  return rows[0] ? mapTemplate(rows[0]) : null;
}

export async function update(
  db: SqlDb,
  type: MessageTemplateType,
  data: { header?: string | undefined; footer?: string | undefined; isActive?: boolean | undefined }
): Promise<MessageTemplate | null> {
  const existing = await findByType(db, type);
  if (!existing) return null;

  const header = data.header ?? existing.header;
  const footer = data.footer ?? existing.footer;
  const isActive = data.isActive !== undefined ? data.isActive : existing.isActive;

  const rows = await db<MessageTemplateRow>`
    UPDATE message_templates
    SET header = ${header}, footer = ${footer}, is_active = ${isActive}, updated_at = NOW()
    WHERE type = ${type}
    RETURNING *
  `;
  return rows[0] ? mapTemplate(rows[0]) : null;
}

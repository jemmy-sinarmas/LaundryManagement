import type { FastifyInstance } from 'fastify';

// Children before parents — CASCADE is the safety net, explicit order makes failures clear
const TRUNCATE_TABLES = [
  'notification_log',
  'order_status_history',
  'order_items',
  'orders',
  'shifts',
  'inventory_transactions',
  'expenses',
  'memberships',
  'inventory_items',
  'items',
  'promotions',
  'expense_categories',
  'customers',
  'users',
  'branches',
  'settings',
  'message_templates',
].join(', ');

export async function truncateAll(app: FastifyInstance): Promise<void> {
  await app.db.unsafe(
    `TRUNCATE TABLE ${TRUNCATE_TABLES} RESTART IDENTITY CASCADE`
  );
}

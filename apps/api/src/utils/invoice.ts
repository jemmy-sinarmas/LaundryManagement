import type { SqlDb } from '../lib/db-types.js';

export async function generateInvoiceNo(db: SqlDb, branchKode: string, branchId: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const datePart = today.replace(/-/g, '');
  const rows = await db<{ count: string }>`
    SELECT COUNT(*) AS count FROM orders
    WHERE branch_id = ${branchId}
      AND DATE(created_at AT TIME ZONE 'UTC') = ${today}::date
  `;
  const seq = Number(rows[0]?.count ?? 0) + 1;
  return `INV-${branchKode}-${datePart}-${String(seq).padStart(4, '0')}`;
}

import type { ExpenseCategory } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type ExpenseCategoryRow = {
  id: string;
  nama: string;
  level: string;
  created_at: string;
};

function mapExpenseCategory(row: ExpenseCategoryRow): ExpenseCategory {
  return {
    id: row.id,
    nama: row.nama,
    level: row.level as ExpenseCategory['level'],
    createdAt: row.created_at,
  };
}

export async function findAll(db: SqlDb): Promise<ExpenseCategory[]> {
  const rows = await db<ExpenseCategoryRow>`
    SELECT * FROM expense_categories ORDER BY nama
  `;
  return rows.map(mapExpenseCategory);
}

export async function findById(db: SqlDb, id: string): Promise<ExpenseCategory | null> {
  const rows = await db<ExpenseCategoryRow>`
    SELECT * FROM expense_categories WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapExpenseCategory(rows[0]) : null;
}

export async function create(
  db: SqlDb,
  data: { id: string; nama: string; level: string }
): Promise<ExpenseCategory> {
  const rows = await db<ExpenseCategoryRow>`
    INSERT INTO expense_categories (id, nama, level)
    VALUES (${data.id}, ${data.nama}, ${data.level})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapExpenseCategory(rows[0]);
}

import type { Expense, ExpenseCategory } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import { dateOnly } from '../lib/date.js';

type ExpenseRow = {
  id: string;
  tanggal: string | Date;
  jumlah: number | bigint;
  category_id: string;
  deskripsi: string | null;
  inventory_item_id: string | null;
  qty_used: number | string | null;
  branch_id: string | null;
  metode_pembayaran: string;
  created_by: string | null;
  created_at: string;
};

type ExpenseJoinRow = ExpenseRow & {
  cat_id: string | null;
  cat_nama: string | null;
  cat_level: string | null;
};

function mapRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    tanggal: dateOnly(row.tanggal),
    jumlah: Number(row.jumlah),
    categoryId: row.category_id,
    deskripsi: row.deskripsi,
    inventoryItemId: row.inventory_item_id,
    qtyUsed: row.qty_used !== null ? Number(row.qty_used) : null,
    branchId: row.branch_id ?? null,
    metodePembayaran: row.metode_pembayaran as Expense['metodePembayaran'],
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapJoinRow(row: ExpenseJoinRow): Expense {
  const expense = mapRow(row);
  if (row.cat_id) {
    expense.category = {
      id: row.cat_id,
      nama: row.cat_nama ?? '',
      level: row.cat_level as ExpenseCategory['level'],
    };
  }
  return expense;
}

export async function findAll(
  db: SqlDb,
  opts?: { from?: string; to?: string; categoryId?: string; branchId?: string | null }
): Promise<Expense[]> {
  const { from, to, categoryId, branchId } = opts ?? {};

  if (branchId) {
    if (from && to && categoryId) {
      const rows = await db<ExpenseRow>`
        SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
               inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
        FROM expenses
        WHERE branch_id = ${branchId}
          AND tanggal >= ${from}::date AND tanggal <= ${to}::date
          AND category_id = ${categoryId}
        ORDER BY tanggal DESC, created_at DESC
      `;
      return rows.map(mapRow);
    }
    if (from && to) {
      const rows = await db<ExpenseRow>`
        SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
               inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
        FROM expenses
        WHERE branch_id = ${branchId}
          AND tanggal >= ${from}::date AND tanggal <= ${to}::date
        ORDER BY tanggal DESC, created_at DESC
      `;
      return rows.map(mapRow);
    }
    if (categoryId) {
      const rows = await db<ExpenseRow>`
        SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
               inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
        FROM expenses
        WHERE branch_id = ${branchId} AND category_id = ${categoryId}
        ORDER BY tanggal DESC, created_at DESC
      `;
      return rows.map(mapRow);
    }
    const rows = await db<ExpenseRow>`
      SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
             inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
      FROM expenses
      WHERE branch_id = ${branchId}
      ORDER BY tanggal DESC, created_at DESC
    `;
    return rows.map(mapRow);
  }

  if (from && to && categoryId) {
    const rows = await db<ExpenseRow>`
      SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
             inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
      FROM expenses
      WHERE tanggal >= ${from}::date AND tanggal <= ${to}::date
        AND category_id = ${categoryId}
      ORDER BY tanggal DESC, created_at DESC
    `;
    return rows.map(mapRow);
  }
  if (from && to) {
    const rows = await db<ExpenseRow>`
      SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
             inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
      FROM expenses
      WHERE tanggal >= ${from}::date AND tanggal <= ${to}::date
      ORDER BY tanggal DESC, created_at DESC
    `;
    return rows.map(mapRow);
  }
  if (categoryId) {
    const rows = await db<ExpenseRow>`
      SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
             inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
      FROM expenses
      WHERE category_id = ${categoryId}
      ORDER BY tanggal DESC, created_at DESC
    `;
    return rows.map(mapRow);
  }
  const rows = await db<ExpenseRow>`
    SELECT id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
           inventory_item_id, qty_used, branch_id, created_by, created_at
    FROM expenses
    ORDER BY tanggal DESC, created_at DESC
    LIMIT 500
  `;
  return rows.map(mapRow);
}

export async function findById(db: SqlDb, id: string): Promise<Expense | null> {
  const rows = await db<ExpenseJoinRow>`
    SELECT
      e.id,
      e.tanggal::text AS tanggal,
      e.jumlah,
      e.category_id,
      e.deskripsi,
      e.inventory_item_id,
      e.qty_used,
      e.branch_id,
      e.metode_pembayaran,
      e.created_by,
      e.created_at,
      ec.id   AS cat_id,
      ec.nama AS cat_nama,
      ec.level AS cat_level
    FROM expenses e
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    WHERE e.id = ${id}
    LIMIT 1
  `;
  return rows[0] ? mapJoinRow(rows[0]) : null;
}

export async function create(
  db: SqlDb,
  data: {
    id: string;
    tanggal: string;
    jumlah: number;
    categoryId: string;
    deskripsi: string | null;
    inventoryItemId: string | null;
    qtyUsed: number | null;
    branchId: string;
    metodePembayaran: Expense['metodePembayaran'];
    createdBy: string | null;
  }
): Promise<Expense> {
  const rows = await db<ExpenseRow>`
    INSERT INTO expenses
      (id, tanggal, jumlah, category_id, deskripsi, inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by)
    VALUES
      (${data.id}, ${data.tanggal}::date, ${data.jumlah}, ${data.categoryId},
       ${data.deskripsi}, ${data.inventoryItemId}, ${data.qtyUsed}, ${data.branchId}, ${data.metodePembayaran}, ${data.createdBy})
    RETURNING id, tanggal::text AS tanggal, jumlah, category_id, deskripsi,
              inventory_item_id, qty_used, branch_id, metode_pembayaran, created_by, created_at
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapRow(rows[0]);
}

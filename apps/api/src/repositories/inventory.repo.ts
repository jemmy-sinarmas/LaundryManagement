import type { InventoryItem, InventoryTransaction, InventoryTransactionType } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type InventoryItemRow = {
  id: string;
  nama: string;
  satuan: string;
  qty_saat_ini: number | string;
  harga_rata_fifo: number | bigint;
  stok_minimum: number | string;
  is_active: boolean | number;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
};

type TransactionRow = {
  id: string;
  item_id: string;
  tipe: string;
  qty: number | string;
  harga_per_unit: number | bigint | null;
  referensi: string | null;
  foto_referensi: string | null;
  created_by: string | null;
  created_at: string;
};

function mapInventoryItem(row: InventoryItemRow, isLowStock = false): InventoryItem {
  return {
    id: row.id,
    nama: row.nama,
    satuan: row.satuan,
    qtySaatIni: Number(row.qty_saat_ini),
    hargaRataFifo: Number(row.harga_rata_fifo),
    stokMinimum: Number(row.stok_minimum),
    isActive: Boolean(row.is_active),
    branchId: row.branch_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isLowStock,
  };
}

function mapTransaction(row: TransactionRow): InventoryTransaction {
  return {
    id: row.id,
    itemId: row.item_id,
    tipe: row.tipe as InventoryTransactionType,
    qty: Number(row.qty),
    hargaPerUnit: row.harga_per_unit !== null ? Number(row.harga_per_unit) : null,
    referensi: row.referensi,
    fotoReferensi: row.foto_referensi ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function findAll(
  db: SqlDb,
  options: { includeInactive?: boolean; branchId?: string | null } = {}
): Promise<InventoryItem[]> {
  const { includeInactive = false, branchId } = options;

  if (branchId) {
    if (includeInactive) {
      const rows = await db<InventoryItemRow>`
        SELECT * FROM inventory_items WHERE branch_id = ${branchId} ORDER BY nama
      `;
      return rows.map((r) => mapInventoryItem(r));
    }
    const rows = await db<InventoryItemRow>`
      SELECT * FROM inventory_items WHERE branch_id = ${branchId} AND is_active = true ORDER BY nama
    `;
    return rows.map((r) => mapInventoryItem(r));
  }

  if (includeInactive) {
    const rows = await db<InventoryItemRow>`SELECT * FROM inventory_items ORDER BY nama`;
    return rows.map((r) => mapInventoryItem(r));
  }
  const rows = await db<InventoryItemRow>`
    SELECT * FROM inventory_items WHERE is_active = true ORDER BY nama
  `;
  return rows.map((r) => mapInventoryItem(r));
}

export async function findById(db: SqlDb, id: string): Promise<InventoryItem | null> {
  const rows = await db<InventoryItemRow>`
    SELECT * FROM inventory_items WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapInventoryItem(rows[0]) : null;
}

export async function findLowStock(db: SqlDb, branchId?: string | null): Promise<InventoryItem[]> {
  if (branchId) {
    const rows = await db<InventoryItemRow>`
      SELECT * FROM inventory_items
      WHERE qty_saat_ini <= stok_minimum AND is_active = true AND branch_id = ${branchId}
      ORDER BY (qty_saat_ini - stok_minimum) ASC
    `;
    return rows.map((r) => mapInventoryItem(r, true));
  }
  const rows = await db<InventoryItemRow>`
    SELECT * FROM inventory_items
    WHERE qty_saat_ini <= stok_minimum AND is_active = true
    ORDER BY (qty_saat_ini - stok_minimum) ASC
  `;
  return rows.map((r) => mapInventoryItem(r, true));
}

export async function create(
  db: SqlDb,
  data: { id: string; nama: string; satuan: string; stokMinimum: number; branchId: string }
): Promise<InventoryItem> {
  const rows = await db<InventoryItemRow>`
    INSERT INTO inventory_items (id, nama, satuan, stok_minimum, branch_id)
    VALUES (${data.id}, ${data.nama}, ${data.satuan}, ${data.stokMinimum}, ${data.branchId})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapInventoryItem(rows[0]);
}

export async function update(
  db: SqlDb,
  id: string,
  data: { nama?: string | undefined; satuan?: string | undefined; stokMinimum?: number | undefined }
): Promise<InventoryItem | null> {
  const existing = await findById(db, id);
  if (!existing) return null;
  const nama = data.nama ?? existing.nama;
  const satuan = data.satuan ?? existing.satuan;
  const stokMinimum = data.stokMinimum ?? existing.stokMinimum;
  const rows = await db<InventoryItemRow>`
    UPDATE inventory_items
    SET nama = ${nama}, satuan = ${satuan}, stok_minimum = ${stokMinimum}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapInventoryItem(rows[0]) : null;
}

export async function updateQtyAndFifo(
  db: SqlDb,
  id: string,
  newQty: number,
  newFifo: number
): Promise<void> {
  await db`
    UPDATE inventory_items
    SET qty_saat_ini = ${newQty}, harga_rata_fifo = ${newFifo}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function findTransactionsByItemId(
  db: SqlDb,
  itemId: string
): Promise<InventoryTransaction[]> {
  const rows = await db<TransactionRow>`
    SELECT * FROM inventory_transactions
    WHERE item_id = ${itemId}
    ORDER BY created_at DESC
  `;
  return rows.map(mapTransaction);
}

export async function createTransaction(
  db: SqlDb,
  data: {
    id: string;
    itemId: string;
    tipe: 'masuk' | 'keluar';
    qty: number;
    hargaPerUnit: number | null;
    referensi: string | null;
    fotoReferensi?: string | null;
    createdBy: string | null;
  }
): Promise<InventoryTransaction> {
  const rows = await db<TransactionRow>`
    INSERT INTO inventory_transactions
      (id, item_id, tipe, qty, harga_per_unit, referensi, foto_referensi, created_by)
    VALUES
      (${data.id}, ${data.itemId}, ${data.tipe}, ${data.qty},
       ${data.hargaPerUnit}, ${data.referensi}, ${data.fotoReferensi ?? null}, ${data.createdBy})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapTransaction(rows[0]);
}

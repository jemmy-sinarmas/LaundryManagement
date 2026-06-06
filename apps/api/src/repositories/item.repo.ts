import type { Item } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type ItemRow = {
  id: string;
  nama: string;
  tipe: string;
  harga: number | bigint;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
};

function mapItem(row: ItemRow): Item {
  return {
    id: row.id,
    nama: row.nama,
    tipe: row.tipe as Item['tipe'],
    harga: Number(row.harga),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(db: SqlDb, includeInactive = false): Promise<Item[]> {
  if (includeInactive) {
    const rows = await db<ItemRow>`
      SELECT * FROM items ORDER BY nama ASC
    `;
    return rows.map(mapItem);
  }
  const rows = await db<ItemRow>`
    SELECT * FROM items WHERE is_active = true ORDER BY nama ASC
  `;
  return rows.map(mapItem);
}

export async function findById(db: SqlDb, id: string): Promise<Item | null> {
  const rows = await db<ItemRow>`
    SELECT * FROM items WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapItem(rows[0]) : null;
}

export async function create(
  db: SqlDb,
  data: { id: string; nama: string; tipe: string; harga: number }
): Promise<Item> {
  const rows = await db<ItemRow>`
    INSERT INTO items (id, nama, tipe, harga)
    VALUES (${data.id}, ${data.nama}, ${data.tipe}, ${data.harga})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapItem(rows[0]);
}

export async function update(
  db: SqlDb,
  id: string,
  data: { nama?: string | undefined; tipe?: string | undefined; harga?: number | undefined }
): Promise<Item | null> {
  const existing = await findById(db, id);
  if (!existing) return null;

  const nama = data.nama ?? existing.nama;
  const tipe = data.tipe ?? existing.tipe;
  const harga = data.harga ?? existing.harga;

  const rows = await db<ItemRow>`
    UPDATE items
    SET nama = ${nama}, tipe = ${tipe}, harga = ${harga}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapItem(rows[0]) : null;
}

export async function softDelete(db: SqlDb, id: string): Promise<void> {
  await db`
    UPDATE items SET is_active = false, updated_at = NOW() WHERE id = ${id}
  `;
}

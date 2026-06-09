import type { Promotion } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type PromotionRow = {
  id: string;
  nama: string;
  tipe: string;
  nilai: number | bigint;
  min_order: number | bigint;
  tanggal_mulai: string;
  tanggal_selesai: string;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: PromotionRow): Promotion {
  return {
    id: row.id,
    nama: row.nama,
    tipe: row.tipe as Promotion['tipe'],
    nilai: Number(row.nilai),
    minOrder: Number(row.min_order),
    tanggalMulai: row.tanggal_mulai.slice(0, 10),
    tanggalSelesai: row.tanggal_selesai.slice(0, 10),
    branchId: row.branch_id ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(db: SqlDb, branchId?: string | null): Promise<Promotion[]> {
  if (branchId) {
    const rows = await db<PromotionRow>`
      SELECT * FROM promotions WHERE (branch_id = ${branchId} OR branch_id IS NULL) ORDER BY created_at DESC
    `;
    return rows.map(mapRow);
  }
  const rows = await db<PromotionRow>`SELECT * FROM promotions ORDER BY created_at DESC`;
  return rows.map(mapRow);
}

export async function findActive(
  db: SqlDb,
  branchId: string,
  today: string,
  minOrder: number
): Promise<Promotion[]> {
  const rows = await db<PromotionRow>`
    SELECT * FROM promotions
    WHERE is_active = TRUE
      AND tanggal_mulai <= ${today}::date
      AND tanggal_selesai >= ${today}::date
      AND min_order <= ${minOrder}
      AND (branch_id = ${branchId} OR branch_id IS NULL)
    ORDER BY nilai DESC
  `;
  return rows.map(mapRow);
}

export async function findById(db: SqlDb, id: string): Promise<Promotion | null> {
  const rows = await db<PromotionRow>`SELECT * FROM promotions WHERE id = ${id} LIMIT 1`;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function create(
  db: SqlDb,
  data: {
    id: string;
    nama: string;
    tipe: string;
    nilai: number;
    minOrder: number;
    tanggalMulai: string;
    tanggalSelesai: string;
    branchId: string | null;
  }
): Promise<Promotion> {
  const rows = await db<PromotionRow>`
    INSERT INTO promotions (id, nama, tipe, nilai, min_order, tanggal_mulai, tanggal_selesai, branch_id)
    VALUES (${data.id}, ${data.nama}, ${data.tipe}, ${data.nilai}, ${data.minOrder},
            ${data.tanggalMulai}::date, ${data.tanggalSelesai}::date, ${data.branchId})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapRow(rows[0]);
}

export async function update(
  db: SqlDb,
  id: string,
  data: {
    nama?: string | undefined;
    nilai?: number | undefined;
    tanggalMulai?: string | undefined;
    tanggalSelesai?: string | undefined;
    minOrder?: number | undefined;
    isActive?: boolean | undefined;
  }
): Promise<Promotion | null> {
  const nama = data.nama ?? null;
  const nilai = data.nilai ?? null;
  const tanggalMulai = data.tanggalMulai ?? null;
  const tanggalSelesai = data.tanggalSelesai ?? null;
  const minOrder = data.minOrder ?? null;
  const isActive = data.isActive ?? null;
  const rows = await db<PromotionRow>`
    UPDATE promotions SET
      nama            = COALESCE(${nama}, nama),
      nilai           = COALESCE(${nilai}, nilai),
      tanggal_mulai   = COALESCE(${tanggalMulai}::date, tanggal_mulai),
      tanggal_selesai = COALESCE(${tanggalSelesai}::date, tanggal_selesai),
      min_order       = COALESCE(${minOrder}, min_order),
      is_active       = COALESCE(${isActive}, is_active),
      updated_at      = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

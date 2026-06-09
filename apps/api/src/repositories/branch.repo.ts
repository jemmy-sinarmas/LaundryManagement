import type { Branch } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type BranchRow = {
  id: string;
  nama: string;
  kode: string;
  alamat: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    nama: row.nama,
    kode: row.kode,
    alamat: row.alamat,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(db: SqlDb): Promise<Branch[]> {
  const rows = await db<BranchRow>`
    SELECT * FROM branches ORDER BY nama ASC
  `;
  return rows.map(mapBranch);
}

export async function findById(db: SqlDb, id: string): Promise<Branch | null> {
  const rows = await db<BranchRow>`
    SELECT * FROM branches WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapBranch(rows[0]) : null;
}

export async function findByKode(db: SqlDb, kode: string): Promise<Branch | null> {
  const rows = await db<BranchRow>`
    SELECT * FROM branches WHERE kode = ${kode} LIMIT 1
  `;
  return rows[0] ? mapBranch(rows[0]) : null;
}

export async function create(
  db: SqlDb,
  data: { id: string; nama: string; kode: string; alamat?: string | null }
): Promise<Branch> {
  const rows = await db<BranchRow>`
    INSERT INTO branches (id, nama, kode, alamat)
    VALUES (${data.id}, ${data.nama}, ${data.kode}, ${data.alamat ?? null})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapBranch(rows[0]);
}

export async function update(
  db: SqlDb,
  id: string,
  data: { nama?: string | undefined; alamat?: string | null | undefined; isActive?: boolean | undefined }
): Promise<Branch | null> {
  const existing = await findById(db, id);
  if (!existing) return null;

  const nama = data.nama ?? existing.nama;
  const alamat = data.alamat !== undefined ? data.alamat : existing.alamat;
  const isActive = data.isActive !== undefined ? data.isActive : existing.isActive;

  const rows = await db<BranchRow>`
    UPDATE branches
    SET nama = ${nama}, alamat = ${alamat}, is_active = ${isActive}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapBranch(rows[0]) : null;
}

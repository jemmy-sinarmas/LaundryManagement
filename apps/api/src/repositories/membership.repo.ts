import type { Membership, MembershipPeriodik, MembershipPaketKg } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type MembershipRow = {
  id: string;
  customer_id: string;
  tipe: string;
  durasi_bulan: number | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  paket_kg: number | null;
  sisa_kg: number | null;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
};

function mapMembership(row: MembershipRow): Membership {
  const base = {
    id: row.id,
    customerId: row.customer_id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.tipe === 'periodik') {
    return {
      ...base,
      tipe: 'periodik',
      durasibulan: (row.durasi_bulan ?? 3) as 3 | 6 | 12,
      tanggalMulai: row.tanggal_mulai ?? '',
      tanggalSelesai: row.tanggal_selesai ?? '',
      paketKg: null,
      sisaKg: null,
    } satisfies MembershipPeriodik;
  }

  return {
    ...base,
    tipe: 'paket_kg',
    durasibulan: null,
    tanggalMulai: null,
    tanggalSelesai: null,
    paketKg: Number(row.paket_kg ?? 0),
    sisaKg: Number(row.sisa_kg ?? 0),
  } satisfies MembershipPaketKg;
}

export async function findByCustomerId(db: SqlDb, customerId: string): Promise<Membership | null> {
  const rows = await db<MembershipRow>`
    SELECT * FROM memberships
    WHERE customer_id = ${customerId} AND is_active = true
    LIMIT 1
  `;
  return rows[0] ? mapMembership(rows[0]) : null;
}

export async function findById(db: SqlDb, id: string): Promise<Membership | null> {
  const rows = await db<MembershipRow>`
    SELECT * FROM memberships WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapMembership(rows[0]) : null;
}

export async function create(
  db: SqlDb,
  data: {
    id: string;
    customerId: string;
    tipe: 'periodik' | 'paket_kg';
    durasibulan: number | null;
    tanggalMulai: string | null;
    tanggalSelesai: string | null;
    paketKg: number | null;
    sisaKg: number | null;
  }
): Promise<Membership> {
  const rows = await db<MembershipRow>`
    INSERT INTO memberships
      (id, customer_id, tipe, durasi_bulan, tanggal_mulai, tanggal_selesai, paket_kg, sisa_kg)
    VALUES
      (${data.id}, ${data.customerId}, ${data.tipe},
       ${data.durasibulan}, ${data.tanggalMulai}, ${data.tanggalSelesai},
       ${data.paketKg}, ${data.sisaKg})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapMembership(rows[0]);
}

export async function deductKg(db: SqlDb, id: string, kg: number): Promise<void> {
  await db`
    UPDATE memberships
    SET sisa_kg = sisa_kg - ${kg}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function deactivate(db: SqlDb, id: string): Promise<void> {
  await db`
    UPDATE memberships SET is_active = false, updated_at = NOW() WHERE id = ${id}
  `;
}

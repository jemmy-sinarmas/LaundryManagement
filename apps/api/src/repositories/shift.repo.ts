import { randomUUID } from 'node:crypto';
import type { Shift } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type ShiftRow = {
  id: string;
  kasir_id: string;
  branch_id: string;
  start_time: string;
  end_time: string | null;
  start_cash: number | bigint;
  end_cash: number | bigint | null;
  notes: string | null;
  created_at: string;
  // joined fields
  kasir_nama?: string;
  kasir_username?: string;
  branch_nama?: string;
};

function mapRow(row: ShiftRow): Shift {
  const shift: Shift = {
    id: row.id,
    kasirId: row.kasir_id,
    branchId: row.branch_id,
    startTime: row.start_time,
    endTime: row.end_time ?? null,
    startCash: Number(row.start_cash),
    endCash: row.end_cash !== null && row.end_cash !== undefined ? Number(row.end_cash) : null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  };
  if (row.kasir_nama !== undefined) {
    shift.kasir = { id: row.kasir_id, nama: row.kasir_nama, username: row.kasir_username ?? '' };
  }
  if (row.branch_nama !== undefined) {
    shift.branch = { id: row.branch_id, nama: row.branch_nama };
  }
  return shift;
}

export async function findCurrent(db: SqlDb, kasirId: string): Promise<Shift | null> {
  const rows = await db<ShiftRow>`
    SELECT s.*, u.nama AS kasir_nama, u.username AS kasir_username, b.nama AS branch_nama
    FROM shifts s
    JOIN users    u ON u.id = s.kasir_id
    JOIN branches b ON b.id = s.branch_id
    WHERE s.kasir_id = ${kasirId} AND s.end_time IS NULL
    LIMIT 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function startShift(
  db: SqlDb,
  kasirId: string,
  branchId: string,
  startCash: number
): Promise<Shift> {
  const id = randomUUID();
  const rows = await db<ShiftRow>`
    INSERT INTO shifts (id, kasir_id, branch_id, start_cash)
    VALUES (${id}, ${kasirId}, ${branchId}, ${startCash})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapRow(rows[0]);
}

export async function endShift(
  db: SqlDb,
  shiftId: string,
  endCash: number,
  notes: string | null
): Promise<Shift> {
  const rows = await db<ShiftRow>`
    UPDATE shifts
    SET end_time = NOW(), end_cash = ${endCash}, notes = ${notes}
    WHERE id = ${shiftId}
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Shift not found');
  return mapRow(rows[0]);
}

export async function findAll(
  db: SqlDb,
  opts?: { branchId?: string | undefined; from?: string | undefined; to?: string | undefined }
): Promise<Shift[]> {
  const branchId = opts?.branchId ?? null;
  const from = opts?.from ?? null;
  const to = opts?.to ?? null;

  if (branchId && from && to) {
    const rows = await db<ShiftRow>`
      SELECT s.*, u.nama AS kasir_nama, u.username AS kasir_username, b.nama AS branch_nama
      FROM shifts s
      JOIN users    u ON u.id = s.kasir_id
      JOIN branches b ON b.id = s.branch_id
      WHERE s.branch_id = ${branchId}
        AND DATE(s.start_time AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
      ORDER BY s.start_time DESC
    `;
    return rows.map(mapRow);
  }
  if (branchId) {
    const rows = await db<ShiftRow>`
      SELECT s.*, u.nama AS kasir_nama, u.username AS kasir_username, b.nama AS branch_nama
      FROM shifts s
      JOIN users    u ON u.id = s.kasir_id
      JOIN branches b ON b.id = s.branch_id
      WHERE s.branch_id = ${branchId}
      ORDER BY s.start_time DESC
      LIMIT 500
    `;
    return rows.map(mapRow);
  }
  if (from && to) {
    const rows = await db<ShiftRow>`
      SELECT s.*, u.nama AS kasir_nama, u.username AS kasir_username, b.nama AS branch_nama
      FROM shifts s
      JOIN users    u ON u.id = s.kasir_id
      JOIN branches b ON b.id = s.branch_id
      WHERE DATE(s.start_time AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
      ORDER BY s.start_time DESC
    `;
    return rows.map(mapRow);
  }
  const rows = await db<ShiftRow>`
    SELECT s.*, u.nama AS kasir_nama, u.username AS kasir_username, b.nama AS branch_nama
    FROM shifts s
    JOIN users    u ON u.id = s.kasir_id
    JOIN branches b ON b.id = s.branch_id
    ORDER BY s.start_time DESC
    LIMIT 500
  `;
  return rows.map(mapRow);
}

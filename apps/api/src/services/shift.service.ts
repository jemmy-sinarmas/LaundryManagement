import type { Shift } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as shiftRepo from '../repositories/shift.repo.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function getCurrentShift(db: SqlDb, kasirId: string): Promise<Shift | null> {
  return shiftRepo.findCurrent(db, kasirId);
}

export async function startShift(
  db: SqlDb,
  kasirId: string,
  branchId: string,
  startCash: number
): Promise<Shift> {
  const existing = await shiftRepo.findCurrent(db, kasirId);
  if (existing) throw makeError('Shift sudah aktif. Akhiri shift saat ini terlebih dahulu.', 409);
  return shiftRepo.startShift(db, kasirId, branchId, startCash);
}

export async function endShift(
  db: SqlDb,
  kasirId: string,
  endCash: number,
  notes: string | null
): Promise<Shift> {
  const current = await shiftRepo.findCurrent(db, kasirId);
  if (!current) throw makeError('Tidak ada shift aktif untuk diakhiri.', 404);
  return shiftRepo.endShift(db, current.id, endCash, notes);
}

export async function listShifts(
  db: SqlDb,
  opts?: { branchId?: string | undefined; from?: string | undefined; to?: string | undefined }
): Promise<Shift[]> {
  return shiftRepo.findAll(db, opts);
}

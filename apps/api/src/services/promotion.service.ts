import { randomUUID } from 'node:crypto';
import type { Promotion } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as promotionRepo from '../repositories/promotion.repo.js';
import type { CreatePromotionInput, UpdatePromotionInput } from '../schemas/promotion.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listPromotions(db: SqlDb, branchId?: string | null): Promise<Promotion[]> {
  return promotionRepo.findAll(db, branchId ?? undefined);
}

export async function getActivePromotions(
  db: SqlDb,
  branchId: string,
  subtotal: number
): Promise<Promotion[]> {
  const today = new Date().toISOString().slice(0, 10);
  return promotionRepo.findActive(db, branchId, today, subtotal);
}

export async function createPromotion(db: SqlDb, data: CreatePromotionInput): Promise<Promotion> {
  return promotionRepo.create(db, {
    id: randomUUID(),
    nama: data.nama,
    tipe: data.tipe,
    nilai: data.nilai,
    minOrder: data.minOrder ?? 0,
    tanggalMulai: data.tanggalMulai,
    tanggalSelesai: data.tanggalSelesai,
    branchId: data.branchId ?? null,
  });
}

export async function updatePromotion(
  db: SqlDb,
  id: string,
  data: UpdatePromotionInput
): Promise<Promotion> {
  const updated = await promotionRepo.update(db, id, data);
  if (!updated) throw makeError('Promotion not found', 404);
  return updated;
}

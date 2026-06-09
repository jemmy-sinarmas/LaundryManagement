import { randomUUID } from 'node:crypto';
import type { Branch } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as branchRepo from '../repositories/branch.repo.js';
import type { CreateBranchInput, UpdateBranchInput } from '../schemas/branch.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listBranches(db: SqlDb): Promise<Branch[]> {
  return branchRepo.findAll(db);
}

export async function getBranch(db: SqlDb, id: string): Promise<Branch> {
  const branch = await branchRepo.findById(db, id);
  if (!branch) throw makeError('Branch not found', 404);
  return branch;
}

export async function createBranch(db: SqlDb, data: CreateBranchInput): Promise<Branch> {
  const kode = data.kode.toUpperCase();
  const existing = await branchRepo.findByKode(db, kode);
  if (existing) throw makeError('Kode cabang sudah digunakan', 409);
  return branchRepo.create(db, {
    id: randomUUID(),
    nama: data.nama,
    kode,
    alamat: data.alamat ?? null,
  });
}

export async function updateBranch(
  db: SqlDb,
  id: string,
  data: UpdateBranchInput
): Promise<Branch> {
  const branch = await branchRepo.update(db, id, data);
  if (!branch) throw makeError('Branch not found', 404);
  return branch;
}

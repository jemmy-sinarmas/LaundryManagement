import { randomUUID } from 'node:crypto';
import type { Item } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as itemRepo from '../repositories/item.repo.js';
import type { CreateItemInput, UpdateItemInput } from '../schemas/item.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listItems(db: SqlDb, includeInactive = false): Promise<Item[]> {
  return itemRepo.findAll(db, includeInactive);
}

export async function getItem(db: SqlDb, id: string): Promise<Item> {
  const item = await itemRepo.findById(db, id);
  if (!item) throw makeError('Item not found', 404);
  return item;
}

export async function createItem(db: SqlDb, data: CreateItemInput): Promise<Item> {
  return itemRepo.create(db, { id: randomUUID(), ...data });
}

export async function updateItem(db: SqlDb, id: string, data: UpdateItemInput): Promise<Item> {
  const item = await itemRepo.update(db, id, data);
  if (!item) throw makeError('Item not found', 404);
  return item;
}

export async function deleteItem(db: SqlDb, id: string): Promise<void> {
  const item = await itemRepo.findById(db, id);
  if (!item) throw makeError('Item not found', 404);
  await itemRepo.softDelete(db, id);
}

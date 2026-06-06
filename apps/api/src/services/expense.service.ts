import { randomUUID } from 'node:crypto';
import type { Expense } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as expenseRepo from '../repositories/expense.repo.js';
import * as expenseCategoryRepo from '../repositories/expense-category.repo.js';
import { recordUsage } from './inventory.service.js';
import type { CreateExpenseInput } from '../schemas/expense.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function createExpense(
  db: SqlDb,
  data: CreateExpenseInput,
  userId: string
): Promise<Expense> {
  const category = await expenseCategoryRepo.findById(db, data.categoryId);
  if (!category) throw makeError('Expense category not found', 404);

  const inventoryItemId = data.inventoryItemId ?? null;
  const qtyUsed = data.qtyUsed ?? null;

  if (inventoryItemId !== null) {
    if (qtyUsed === null) {
      throw makeError('qtyUsed wajib jika inventoryItemId diisi', 400);
    }
    await recordUsage(
      db,
      inventoryItemId,
      qtyUsed,
      `Expense: ${data.deskripsi ?? ''}`,
      userId
    );
  }

  return expenseRepo.create(db, {
    id: randomUUID(),
    tanggal: data.tanggal,
    jumlah: data.jumlah,
    categoryId: data.categoryId,
    deskripsi: data.deskripsi ?? null,
    inventoryItemId,
    qtyUsed,
    createdBy: userId,
  });
}

export async function listExpenses(
  db: SqlDb,
  opts?: { from?: string; to?: string; categoryId?: string }
): Promise<Expense[]> {
  return expenseRepo.findAll(db, opts);
}

export async function getExpense(db: SqlDb, id: string): Promise<Expense> {
  const expense = await expenseRepo.findById(db, id);
  if (!expense) throw makeError('Expense not found', 404);
  return expense;
}

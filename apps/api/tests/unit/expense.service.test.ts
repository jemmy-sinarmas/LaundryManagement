import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createExpense } from '../../src/services/expense.service.js';
import type { Expense, ExpenseCategory, InventoryTransaction } from '@laundry-palu/shared';

vi.mock('../../src/repositories/expense.repo.js');
vi.mock('../../src/repositories/expense-category.repo.js');
vi.mock('../../src/services/inventory.service.js');

import * as expenseRepo from '../../src/repositories/expense.repo.js';
import * as expenseCategoryRepo from '../../src/repositories/expense-category.repo.js';
import * as inventoryService from '../../src/services/inventory.service.js';

afterEach(() => {
  vi.clearAllMocks();
});

const mockDb = {} as Parameters<typeof createExpense>[0];

const mockCategory: ExpenseCategory = {
  id: 'cat-1',
  nama: 'Bahan Cuci',
  level: 'variabel',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockExpense: Expense = {
  id: 'exp-1',
  tanggal: '2026-06-06',
  jumlah: 150000,
  categoryId: 'cat-1',
  deskripsi: null,
  inventoryItemId: null,
  qtyUsed: null,
  createdBy: 'user-1',
  createdAt: '2026-06-06T00:00:00Z',
};

const mockTransaction: InventoryTransaction = {
  id: 'tx-1',
  itemId: 'inv-1',
  tipe: 'keluar',
  qty: 5,
  hargaPerUnit: null,
  referensi: null,
  createdBy: 'user-1',
  createdAt: '2026-06-06T00:00:00Z',
};

describe('createExpense', () => {
  beforeEach(() => {
    vi.mocked(expenseCategoryRepo.findById).mockResolvedValue(mockCategory);
    vi.mocked(expenseRepo.create).mockResolvedValue(mockExpense);
  });

  it('throws 404 when category not found', async () => {
    vi.mocked(expenseCategoryRepo.findById).mockResolvedValue(null);

    await expect(
      createExpense(
        mockDb,
        { tanggal: '2026-06-06', jumlah: 100000, categoryId: 'bad-cat' },
        'user-1'
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('creates expense without inventory deduction when no inventoryItemId', async () => {
    await createExpense(
      mockDb,
      { tanggal: '2026-06-06', jumlah: 150000, categoryId: 'cat-1' },
      'user-1'
    );

    expect(vi.mocked(inventoryService.recordUsage)).not.toHaveBeenCalled();
    expect(vi.mocked(expenseRepo.create)).toHaveBeenCalledOnce();
  });

  it('calls recordUsage when inventoryItemId is provided with qtyUsed', async () => {
    vi.mocked(inventoryService.recordUsage).mockResolvedValue(mockTransaction);

    await createExpense(
      mockDb,
      {
        tanggal: '2026-06-06',
        jumlah: 150000,
        categoryId: 'cat-1',
        inventoryItemId: 'inv-1',
        qtyUsed: 5,
        deskripsi: 'Beli deterjen',
      },
      'user-1'
    );

    expect(vi.mocked(inventoryService.recordUsage)).toHaveBeenCalledWith(
      mockDb,
      'inv-1',
      5,
      'Expense: Beli deterjen',
      'user-1'
    );
  });

  it('throws 400 when inventoryItemId provided but qtyUsed is missing', async () => {
    await expect(
      createExpense(
        mockDb,
        {
          tanggal: '2026-06-06',
          jumlah: 150000,
          categoryId: 'cat-1',
          inventoryItemId: 'inv-1',
        },
        'user-1'
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

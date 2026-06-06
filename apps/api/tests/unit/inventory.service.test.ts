import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateFifoAverage } from '../../src/utils/fifo.js';
import {
  recordPurchase,
  recordUsage,
  getLowStockItems,
} from '../../src/services/inventory.service.js';
import type { InventoryItem, InventoryTransaction } from '@laundry-palu/shared';

vi.mock('../../src/repositories/inventory.repo.js');

import * as inventoryRepo from '../../src/repositories/inventory.repo.js';

afterEach(() => {
  vi.clearAllMocks();
});

const mockDb = {} as Parameters<typeof recordPurchase>[0];

const mockItem: InventoryItem = {
  id: 'item-1',
  nama: 'Deterjen',
  satuan: 'kg',
  qtySaatIni: 100,
  hargaRataFifo: 5000,
  stokMinimum: 10,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockTransaction: InventoryTransaction = {
  id: 'tx-1',
  itemId: 'item-1',
  tipe: 'masuk',
  qty: 50,
  hargaPerUnit: 7000,
  referensi: null,
  createdBy: null,
  createdAt: '2026-06-06T00:00:00Z',
};

describe('calculateFifoAverage', () => {
  it('returns inPrice when currentQty is 0 (initial purchase)', () => {
    expect(calculateFifoAverage(0, 0, 100, 5000)).toBe(5000);
  });

  it('blends two batches correctly', () => {
    // floor(((100*5000)+(50*7000))/(150)) = floor(850000/150) = floor(5666.67) = 5666
    expect(calculateFifoAverage(100, 5000, 50, 7000)).toBe(5666);
  });

  it('returns 0 when both quantities are 0', () => {
    expect(calculateFifoAverage(0, 0, 0, 0)).toBe(0);
  });

  it('returns currentAvg when inQty is 0 (no new stock)', () => {
    expect(calculateFifoAverage(50, 3000, 0, 0)).toBe(3000);
  });
});

describe('recordPurchase', () => {
  beforeEach(() => {
    vi.mocked(inventoryRepo.findById).mockResolvedValue(mockItem);
    vi.mocked(inventoryRepo.updateQtyAndFifo).mockResolvedValue(undefined);
    vi.mocked(inventoryRepo.createTransaction).mockResolvedValue(mockTransaction);
  });

  it('calls updateQtyAndFifo with FIFO-recalculated values', async () => {
    await recordPurchase(mockDb, 'item-1', 50, 7000, null, null);

    expect(vi.mocked(inventoryRepo.updateQtyAndFifo)).toHaveBeenCalledWith(
      mockDb,
      'item-1',
      150,   // 100 + 50
      5666   // calculateFifoAverage(100, 5000, 50, 7000)
    );
  });

  it('creates a masuk transaction', async () => {
    await recordPurchase(mockDb, 'item-1', 50, 7000, 'PO-001', 'user-1');

    const call = vi.mocked(inventoryRepo.createTransaction).mock.calls[0]?.[1];
    expect(call?.tipe).toBe('masuk');
    expect(call?.qty).toBe(50);
    expect(call?.hargaPerUnit).toBe(7000);
    expect(call?.referensi).toBe('PO-001');
  });

  it('throws 404 when item not found', async () => {
    vi.mocked(inventoryRepo.findById).mockResolvedValue(null);

    await expect(recordPurchase(mockDb, 'bad-id', 50, 7000, null, null)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('recordUsage', () => {
  beforeEach(() => {
    vi.mocked(inventoryRepo.findById).mockResolvedValue(mockItem);
    vi.mocked(inventoryRepo.updateQtyAndFifo).mockResolvedValue(undefined);
    vi.mocked(inventoryRepo.createTransaction).mockResolvedValue({
      ...mockTransaction,
      tipe: 'keluar',
      hargaPerUnit: null,
    });
  });

  it('throws 400 when qty exceeds available stock', async () => {
    await expect(recordUsage(mockDb, 'item-1', 200, null, null)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('creates a keluar transaction with null hargaPerUnit', async () => {
    await recordUsage(mockDb, 'item-1', 30, 'ref-1', 'user-1');

    const call = vi.mocked(inventoryRepo.createTransaction).mock.calls[0]?.[1];
    expect(call?.tipe).toBe('keluar');
    expect(call?.hargaPerUnit).toBeNull();
  });

  it('preserves hargaRataFifo when deducting stock', async () => {
    await recordUsage(mockDb, 'item-1', 30, null, null);

    expect(vi.mocked(inventoryRepo.updateQtyAndFifo)).toHaveBeenCalledWith(
      mockDb,
      'item-1',
      70,    // 100 - 30
      5000   // unchanged
    );
  });
});

describe('getLowStockItems', () => {
  it('delegates to inventoryRepo.findLowStock', async () => {
    const lowItem = { ...mockItem, qtySaatIni: 5, isLowStock: true };
    vi.mocked(inventoryRepo.findLowStock).mockResolvedValue([lowItem]);

    const result = await getLowStockItems(mockDb);

    expect(vi.mocked(inventoryRepo.findLowStock)).toHaveBeenCalledWith(mockDb);
    expect(result).toHaveLength(1);
    expect(result[0]?.isLowStock).toBe(true);
  });
});

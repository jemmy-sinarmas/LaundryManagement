import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as itemService from '../../src/services/item.service.js';
import type { SqlDb } from '../../src/lib/db-types.js';

vi.mock('../../src/repositories/item.repo.js');

import * as itemRepo from '../../src/repositories/item.repo.js';

const mockDb = {} as SqlDb;

const baseItem = {
  id: 'item-1',
  nama: 'Cuci Kiloan',
  tipe: 'kiloan' as const,
  harga: 7000,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('itemService.createItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns created item', async () => {
    vi.mocked(itemRepo.create).mockResolvedValue(baseItem);
    const item = await itemService.createItem(mockDb, {
      nama: 'Cuci Kiloan',
      tipe: 'kiloan',
      harga: 7000,
    });
    expect(item.nama).toBe('Cuci Kiloan');
    expect(item.harga).toBe(7000);
  });
});

describe('itemService.getItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when item not found', async () => {
    vi.mocked(itemRepo.findById).mockResolvedValue(null);
    await expect(itemService.getItem(mockDb, 'unknown')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('itemService.deleteItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when item not found', async () => {
    vi.mocked(itemRepo.findById).mockResolvedValue(null);
    await expect(itemService.deleteItem(mockDb, 'unknown')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('calls softDelete, not hard delete', async () => {
    vi.mocked(itemRepo.findById).mockResolvedValue(baseItem);
    vi.mocked(itemRepo.softDelete).mockResolvedValue(undefined);
    await itemService.deleteItem(mockDb, 'item-1');
    expect(itemRepo.softDelete).toHaveBeenCalledWith(mockDb, 'item-1');
    expect(itemRepo.softDelete).toHaveBeenCalledTimes(1);
  });
});

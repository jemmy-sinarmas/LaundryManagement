import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as promotionService from '../../src/services/promotion.service.js';
import type { SqlDb } from '../../src/lib/db-types.js';
import type { Promotion } from '@laundry-palu/shared';

vi.mock('../../src/repositories/promotion.repo.js');

import * as promotionRepo from '../../src/repositories/promotion.repo.js';

const mockDb = {} as SqlDb;

const basePromotion: Promotion = {
  id: 'promo-1',
  nama: 'Diskon Lebaran',
  tipe: 'persen',
  nilai: 10,
  minOrder: 50000,
  tanggalMulai: '2026-06-01',
  tanggalSelesai: '2026-06-30',
  branchId: null,
  isActive: true,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

describe('promotionService.createPromotion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults minOrder to 0 and branchId to null when omitted', async () => {
    vi.mocked(promotionRepo.create).mockResolvedValue(basePromotion);
    await promotionService.createPromotion(mockDb, {
      nama: 'Diskon Lebaran',
      tipe: 'persen',
      nilai: 10,
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-30',
    });
    expect(promotionRepo.create).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ minOrder: 0, branchId: null, id: expect.any(String) })
    );
  });

  it('passes through provided minOrder and branchId', async () => {
    vi.mocked(promotionRepo.create).mockResolvedValue(basePromotion);
    await promotionService.createPromotion(mockDb, {
      nama: 'Promo Cabang',
      tipe: 'nominal',
      nilai: 5000,
      minOrder: 25000,
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-30',
      branchId: 'branch-9',
    });
    expect(promotionRepo.create).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ minOrder: 25000, branchId: 'branch-9' })
    );
  });
});

describe('promotionService.updatePromotion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when promotion not found', async () => {
    vi.mocked(promotionRepo.update).mockResolvedValue(null);
    await expect(
      promotionService.updatePromotion(mockDb, 'unknown', { nama: 'x' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the updated promotion', async () => {
    vi.mocked(promotionRepo.update).mockResolvedValue(basePromotion);
    const result = await promotionService.updatePromotion(mockDb, 'promo-1', { nilai: 15 });
    expect(result).toEqual(basePromotion);
  });
});

describe('promotionService.getActivePromotions', () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries findActive with today's date (YYYY-MM-DD) and forwards branch + subtotal", async () => {
    vi.mocked(promotionRepo.findActive).mockResolvedValue([basePromotion]);
    await promotionService.getActivePromotions(mockDb, 'branch-1', 80000);
    const today = new Date().toISOString().slice(0, 10);
    expect(promotionRepo.findActive).toHaveBeenCalledWith(mockDb, 'branch-1', today, 80000);
  });
});

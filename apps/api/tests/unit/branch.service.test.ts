import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as branchService from '../../src/services/branch.service.js';
import type { SqlDb } from '../../src/lib/db-types.js';
import type { Branch } from '@laundry-palu/shared';

vi.mock('../../src/repositories/branch.repo.js');

import * as branchRepo from '../../src/repositories/branch.repo.js';

const mockDb = {} as SqlDb;

const baseBranch: Branch = {
  id: 'branch-1',
  nama: 'Cabang Pusat',
  kode: 'PST',
  alamat: 'Jl. Utama 1',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('branchService.createBranch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uppercases kode and defaults alamat to null', async () => {
    vi.mocked(branchRepo.findByKode).mockResolvedValue(null);
    vi.mocked(branchRepo.create).mockResolvedValue(baseBranch);
    await branchService.createBranch(mockDb, { nama: 'Cabang Baru', kode: 'cbg' });
    expect(branchRepo.create).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ kode: 'CBG', alamat: null, id: expect.any(String) })
    );
  });

  it('throws 409 when kode already exists (checked uppercased)', async () => {
    vi.mocked(branchRepo.findByKode).mockResolvedValue(baseBranch);
    await expect(
      branchService.createBranch(mockDb, { nama: 'Dup', kode: 'pst' })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(branchRepo.findByKode).toHaveBeenCalledWith(mockDb, 'PST');
    expect(branchRepo.create).not.toHaveBeenCalled();
  });
});

describe('branchService.getBranch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when branch not found', async () => {
    vi.mocked(branchRepo.findById).mockResolvedValue(null);
    await expect(branchService.getBranch(mockDb, 'unknown')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns the branch when found', async () => {
    vi.mocked(branchRepo.findById).mockResolvedValue(baseBranch);
    const result = await branchService.getBranch(mockDb, 'branch-1');
    expect(result).toEqual(baseBranch);
  });
});

describe('branchService.updateBranch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when branch not found', async () => {
    vi.mocked(branchRepo.update).mockResolvedValue(null);
    await expect(
      branchService.updateBranch(mockDb, 'unknown', { nama: 'x' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

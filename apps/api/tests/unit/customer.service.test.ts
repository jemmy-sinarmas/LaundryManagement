import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as customerService from '../../src/services/customer.service.js';
import type { SqlDb } from '../../src/lib/db-types.js';

vi.mock('../../src/repositories/customer.repo.js');

import * as customerRepo from '../../src/repositories/customer.repo.js';

const mockDb = {} as SqlDb;

const baseCustomer = {
  id: 'cust-1',
  nama: 'Budi Santoso',
  alamat: 'Jl. Palu No. 1',
  noHp: '081234567890',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('customerService.createCustomer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 409 when noHp already exists', async () => {
    vi.mocked(customerRepo.findByNoHp).mockResolvedValue(baseCustomer);
    await expect(
      customerService.createCustomer(mockDb, {
        nama: 'Budi',
        noHp: '081234567890',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('returns created customer on success', async () => {
    vi.mocked(customerRepo.findByNoHp).mockResolvedValue(null);
    vi.mocked(customerRepo.create).mockResolvedValue(baseCustomer);
    const customer = await customerService.createCustomer(mockDb, {
      nama: 'Budi',
      noHp: '081234567890',
    });
    expect(customer.noHp).toBe('081234567890');
    expect(customer.nama).toBe('Budi Santoso');
  });
});

describe('customerService.getCustomer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when customer not found', async () => {
    vi.mocked(customerRepo.findById).mockResolvedValue(null);
    await expect(customerService.getCustomer(mockDb, 'unknown')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns customer when found', async () => {
    vi.mocked(customerRepo.findById).mockResolvedValue(baseCustomer);
    const customer = await customerService.getCustomer(mockDb, 'cust-1');
    expect(customer.id).toBe('cust-1');
  });
});

describe('customerService.updateCustomer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when customer not found', async () => {
    vi.mocked(customerRepo.update).mockResolvedValue(null);
    await expect(
      customerService.updateCustomer(mockDb, 'nonexistent', { nama: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns updated customer', async () => {
    vi.mocked(customerRepo.update).mockResolvedValue({ ...baseCustomer, nama: 'Updated' });
    const customer = await customerService.updateCustomer(mockDb, 'cust-1', { nama: 'Updated' });
    expect(customer.nama).toBe('Updated');
  });
});

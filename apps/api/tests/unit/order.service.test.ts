import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidTransition,
  calculateOrderTotals,
  createOrder,
  updateOrderStatus,
} from '../../src/services/order.service.js';
import type { Branch, OrderStatus, Customer, Item, Membership, Order } from '@laundry-palu/shared';

vi.mock('../../src/repositories/order.repo.js');
vi.mock('../../src/repositories/customer.repo.js');
vi.mock('../../src/repositories/item.repo.js');
vi.mock('../../src/repositories/membership.repo.js');
vi.mock('../../src/repositories/branch.repo.js');
vi.mock('../../src/services/membership.service.js');
vi.mock('../../src/utils/invoice.js');

import * as orderRepo from '../../src/repositories/order.repo.js';
import * as customerRepo from '../../src/repositories/customer.repo.js';
import * as itemRepo from '../../src/repositories/item.repo.js';
import * as membershipRepo from '../../src/repositories/membership.repo.js';
import * as branchRepo from '../../src/repositories/branch.repo.js';
import * as membershipService from '../../src/services/membership.service.js';
import * as invoice from '../../src/utils/invoice.js';

afterEach(() => {
  vi.clearAllMocks();
});

const mockDb = {} as Parameters<typeof createOrder>[0];
const MOCK_BRANCH_ID = 'branch-1';

const mockBranch: Branch = {
  id: MOCK_BRANCH_ID,
  nama: 'Palu Barat',
  kode: 'PLW',
  alamat: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockCustomer: Customer = {
  id: 'cust-1',
  nama: 'Budi',
  alamat: null,
  noHp: '08123456789',
  countryCode: '+62',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockItem: Item = {
  id: 'item-1',
  nama: 'Cuci Kiloan',
  tipe: 'kiloan',
  harga: 6000,
  isActive: true,
  branchId: MOCK_BRANCH_ID,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockOrder: Order = {
  id: 'order-1',
  invoiceNo: 'INV-PLW-20260606-0001',
  customerId: 'cust-1',
  membershipId: null,
  diskonPersen: 0,
  subtotal: 18000,
  diskonAmount: 0,
  total: 18000,
  status: 'diterima',
  catatan: null,
  branchId: MOCK_BRANCH_ID,
  pickupToken: 'some-uuid-token',
  createdBy: 'user-1',
  createdAt: '2026-06-06T00:00:00Z',
  updatedAt: '2026-06-06T00:00:00Z',
};

const mockMembershipPeriodik: Membership = {
  id: 'mem-1',
  customerId: 'cust-1',
  tipe: 'periodik',
  durasibulan: 3,
  tanggalMulai: '2026-06-01',
  tanggalSelesai: '2026-09-01',
  paketKg: null,
  sisaKg: null,
  isActive: true,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

const mockMembershipPaketKg: Membership = {
  id: 'mem-2',
  customerId: 'cust-1',
  tipe: 'paket_kg',
  durasibulan: null,
  tanggalMulai: null,
  tanggalSelesai: null,
  paketKg: 50,
  sisaKg: 30,
  isActive: true,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

describe('isValidTransition', () => {
  it('allows diterima → dicuci', () => {
    expect(isValidTransition('diterima', 'dicuci')).toBe(true);
  });

  it('allows siap_diambil → selesai', () => {
    expect(isValidTransition('siap_diambil', 'selesai')).toBe(true);
  });

  it('rejects skipping a step (diterima → dikeringkan)', () => {
    expect(isValidTransition('diterima', 'dikeringkan')).toBe(false);
  });

  it('rejects backward transition (dicuci → diterima)', () => {
    expect(isValidTransition('dicuci', 'diterima')).toBe(false);
  });

  it('rejects transition from terminal status selesai', () => {
    expect(isValidTransition('selesai', 'diterima' as OrderStatus)).toBe(false);
  });
});

describe('calculateOrderTotals', () => {
  it('applies discount correctly for periodik (10%)', () => {
    const result = calculateOrderTotals([{ harga: 50000, qty: 2 }], 10);
    expect(result).toEqual({ subtotal: 100000, diskonAmount: 10000, total: 90000 });
  });

  it('applies zero discount when no membership', () => {
    const result = calculateOrderTotals([{ harga: 15000, qty: 1 }], 0);
    expect(result).toEqual({ subtotal: 15000, diskonAmount: 0, total: 15000 });
  });
});

describe('createOrder', () => {
  beforeEach(() => {
    vi.mocked(invoice.generateInvoiceNo).mockResolvedValue('INV-PLW-20260606-0001');
    vi.mocked(customerRepo.findById).mockResolvedValue(mockCustomer);
    vi.mocked(itemRepo.findById).mockResolvedValue(mockItem);
    vi.mocked(branchRepo.findById).mockResolvedValue(mockBranch);
    vi.mocked(orderRepo.create).mockResolvedValue(mockOrder);
  });

  it('throws 404 when customer not found', async () => {
    vi.mocked(customerRepo.findById).mockResolvedValue(null);
    vi.mocked(membershipRepo.findByCustomerId).mockResolvedValue(null);
    vi.mocked(membershipService.validateMembership).mockReturnValue({
      membership: null,
      discountPercent: 0,
      warning: null,
    });

    await expect(
      createOrder(mockDb, { customerId: 'bad-id', items: [{ itemId: 'item-1', qty: 3 }] }, 'user-1', MOCK_BRANCH_ID)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('applies 10% discount for active periodik membership', async () => {
    vi.mocked(membershipRepo.findByCustomerId).mockResolvedValue(mockMembershipPeriodik);
    vi.mocked(membershipService.validateMembership).mockReturnValue({
      membership: mockMembershipPeriodik,
      discountPercent: 10,
      warning: null,
    });

    await createOrder(mockDb, { customerId: 'cust-1', items: [{ itemId: 'item-1', qty: 3 }] }, 'user-1', MOCK_BRANCH_ID);

    const createCall = vi.mocked(orderRepo.create).mock.calls[0]?.[1];
    expect(createCall?.diskonPersen).toBe(10);
    expect(createCall?.diskonAmount).toBe(1800); // 10% of 18000
    expect(createCall?.total).toBe(16200);
  });

  it('applies 0% discount for paket_kg membership', async () => {
    vi.mocked(membershipRepo.findByCustomerId).mockResolvedValue(mockMembershipPaketKg);
    vi.mocked(membershipService.validateMembership).mockReturnValue({
      membership: mockMembershipPaketKg,
      discountPercent: 0,
      warning: null,
    });

    await createOrder(mockDb, { customerId: 'cust-1', items: [{ itemId: 'item-1', qty: 3 }] }, 'user-1', MOCK_BRANCH_ID);

    const createCall = vi.mocked(orderRepo.create).mock.calls[0]?.[1];
    expect(createCall?.diskonPersen).toBe(0);
    expect(createCall?.diskonAmount).toBe(0);
  });

  it('calls deductKg with kiloan qty for paket_kg membership', async () => {
    vi.mocked(membershipRepo.findByCustomerId).mockResolvedValue(mockMembershipPaketKg);
    vi.mocked(membershipService.validateMembership).mockReturnValue({
      membership: mockMembershipPaketKg,
      discountPercent: 0,
      warning: null,
    });
    vi.mocked(membershipRepo.deductKg).mockResolvedValue(undefined);

    await createOrder(mockDb, { customerId: 'cust-1', items: [{ itemId: 'item-1', qty: 3 }] }, 'user-1', MOCK_BRANCH_ID);

    expect(vi.mocked(membershipRepo.deductKg)).toHaveBeenCalledWith(mockDb, 'mem-2', 3);
  });

  it('does NOT call deductKg for periodik membership', async () => {
    vi.mocked(membershipRepo.findByCustomerId).mockResolvedValue(mockMembershipPeriodik);
    vi.mocked(membershipService.validateMembership).mockReturnValue({
      membership: mockMembershipPeriodik,
      discountPercent: 10,
      warning: null,
    });

    await createOrder(mockDb, { customerId: 'cust-1', items: [{ itemId: 'item-1', qty: 3 }] }, 'user-1', MOCK_BRANCH_ID);

    expect(vi.mocked(membershipRepo.deductKg)).not.toHaveBeenCalled();
  });
});

describe('updateOrderStatus', () => {
  beforeEach(() => {
    vi.mocked(orderRepo.findById).mockResolvedValue(mockOrder);
    vi.mocked(orderRepo.updateStatus).mockResolvedValue({
      ...mockOrder,
      status: 'dicuci',
    });
  });

  it('throws 404 when order not found', async () => {
    vi.mocked(orderRepo.findById).mockResolvedValue(null);

    await expect(
      updateOrderStatus(mockDb, 'bad-id', 'dicuci', 'user-1')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 for invalid backward transition', async () => {
    await expect(
      updateOrderStatus(mockDb, 'order-1', 'diterima', 'user-1')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns updated order for valid transition', async () => {
    const result = await updateOrderStatus(mockDb, 'order-1', 'dicuci', 'user-1');
    expect(result.status).toBe('dicuci');
  });
});

import { describe, it, expect } from 'vitest';
import { validateMembership } from '../../src/services/membership.service.js';
import type { MembershipPeriodik, MembershipPaketKg } from '@laundry-palu/shared';

const basePeriodik: MembershipPeriodik = {
  id: 'mem-1',
  customerId: 'cust-1',
  tipe: 'periodik',
  durasibulan: 6,
  tanggalMulai: '2026-01-01',
  tanggalSelesai: '2026-07-01',
  paketKg: null,
  sisaKg: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const basePaketKg: MembershipPaketKg = {
  id: 'mem-2',
  customerId: 'cust-2',
  tipe: 'paket_kg',
  durasibulan: null,
  tanggalMulai: null,
  tanggalSelesai: null,
  paketKg: 50,
  sisaKg: 30,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('validateMembership', () => {
  it('returns no discount and no warning for null membership', () => {
    const result = validateMembership(null);
    expect(result.membership).toBeNull();
    expect(result.discountPercent).toBe(0);
    expect(result.warning).toBeNull();
  });

  it('returns 10% discount for active periodik membership', () => {
    const result = validateMembership(basePeriodik, '2026-04-01');
    expect(result.discountPercent).toBe(10);
    expect(result.warning).toBeNull();
    expect(result.membership).not.toBeNull();
  });

  it('returns 0% discount and warning for expired periodik membership', () => {
    const result = validateMembership(basePeriodik, '2026-08-01');
    expect(result.discountPercent).toBe(0);
    expect(result.warning).toMatch(/kadaluarsa/);
  });

  it('returns no discount and no warning for paket_kg with sufficient balance', () => {
    const result = validateMembership(basePaketKg, '2026-04-01');
    expect(result.discountPercent).toBe(0);
    expect(result.warning).toBeNull();
  });

  it('returns warning for paket_kg with low balance (< 5 kg)', () => {
    const lowBalance = { ...basePaketKg, sisaKg: 3 };
    const result = validateMembership(lowBalance, '2026-04-01');
    expect(result.discountPercent).toBe(0);
    expect(result.warning).toMatch(/hampir habis/);
  });

  it('returns no discount and no warning for exactly 5 kg balance', () => {
    const exactly5 = { ...basePaketKg, sisaKg: 5 };
    const result = validateMembership(exactly5, '2026-04-01');
    expect(result.warning).toBeNull();
  });

  it('treats inactive membership as null', () => {
    const inactive = { ...basePeriodik, isActive: false };
    const result = validateMembership(inactive, '2026-04-01');
    expect(result.membership).toBeNull();
    expect(result.discountPercent).toBe(0);
  });
});

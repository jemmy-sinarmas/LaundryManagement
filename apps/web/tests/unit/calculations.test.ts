import { describe, it, expect } from 'vitest';
import type { Promotion } from '@laundry-palu/shared';
import { calcSubtotal, calcOrderTotals, type PricedLine } from '@/lib/calculations';

function line(harga: number, qty: number): PricedLine {
  return { item: { harga }, qty };
}

function promo(overrides: Partial<Promotion>): Promotion {
  return {
    id: 'p1',
    nama: 'Promo',
    tipe: 'persen',
    nilai: 10,
    minOrder: 0,
    tanggalMulai: '2026-01-01',
    tanggalSelesai: '2026-12-31',
    branchId: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('calcSubtotal', () => {
  it('sums floored per-line amounts', () => {
    expect(calcSubtotal([line(10000, 2), line(5000, 1)])).toBe(25000);
  });

  it('floors each line individually (fractional qty/price)', () => {
    // 1500.5 * 3 = 4501.5 -> floored to 4501 per line
    expect(calcSubtotal([line(1500.5, 3)])).toBe(4501);
  });

  it('returns 0 for an empty cart', () => {
    expect(calcSubtotal([])).toBe(0);
  });
});

describe('calcOrderTotals', () => {
  it('applies a membership discount percentage', () => {
    const t = calcOrderTotals({ subtotal: 20000, discountPercent: 10, promo: null });
    expect(t.diskonAmount).toBe(2000);
    expect(t.promoDiskonAmount).toBe(0);
    expect(t.total).toBe(18000);
  });

  it('applies a percentage promo', () => {
    const t = calcOrderTotals({ subtotal: 20000, discountPercent: 0, promo: promo({ tipe: 'persen', nilai: 15 }) });
    expect(t.promoDiskonAmount).toBe(3000);
    expect(t.total).toBe(17000);
  });

  it('applies a fixed (nominal) promo', () => {
    const t = calcOrderTotals({ subtotal: 20000, discountPercent: 0, promo: promo({ tipe: 'nominal', nilai: 5000 }) });
    expect(t.promoDiskonAmount).toBe(5000);
    expect(t.total).toBe(15000);
  });

  it('caps a nominal promo at the subtotal (never below 0 from promo)', () => {
    const t = calcOrderTotals({ subtotal: 3000, discountPercent: 0, promo: promo({ tipe: 'nominal', nilai: 5000 }) });
    expect(t.promoDiskonAmount).toBe(3000);
    expect(t.total).toBe(0);
  });

  it('stacks membership discount and promo on the same subtotal', () => {
    const t = calcOrderTotals({ subtotal: 20000, discountPercent: 10, promo: promo({ tipe: 'persen', nilai: 15 }) });
    expect(t.diskonAmount).toBe(2000);
    expect(t.promoDiskonAmount).toBe(3000);
    expect(t.total).toBe(15000);
  });

  it('floors the membership discount amount', () => {
    // 12345 * 10% = 1234.5 -> 1234
    const t = calcOrderTotals({ subtotal: 12345, discountPercent: 10, promo: null });
    expect(t.diskonAmount).toBe(1234);
    expect(t.total).toBe(11111);
  });

  it('is a no-op with no discount and no promo', () => {
    const t = calcOrderTotals({ subtotal: 9999, discountPercent: 0, promo: null });
    expect(t).toEqual({ diskonAmount: 0, promoDiskonAmount: 0, total: 9999 });
  });
});

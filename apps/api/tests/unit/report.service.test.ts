import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildIncomeStatement,
  countNewReturningCustomers,
  getDashboard,
  getIncomeStatement,
  getInventoryReport,
} from '../../src/services/report.service.js';
import type { InventoryItem } from '@laundry-palu/shared';

vi.mock('../../src/repositories/report.repo.js');
vi.mock('../../src/repositories/inventory.repo.js');

import * as reportRepo from '../../src/repositories/report.repo.js';
import * as inventoryRepo from '../../src/repositories/inventory.repo.js';

afterEach(() => {
  vi.clearAllMocks();
});

const mockDb = {} as Parameters<typeof getDashboard>[0];

// ---- buildIncomeStatement (pure) ----

describe('buildIncomeStatement', () => {
  it('calculates grossProfit and netProfit correctly', () => {
    const result = buildIncomeStatement('2026-06-01', '2026-06-30', 25_000_000, 8_000_000, 3_000_000);
    expect(result.grossProfit).toBe(17_000_000);
    expect(result.netProfit).toBe(14_000_000);
    expect(result.revenue).toBe(25_000_000);
    expect(result.variableCosts).toBe(8_000_000);
    expect(result.fixedCosts).toBe(3_000_000);
  });

  it('returns revenue as both grossProfit and netProfit when costs are zero', () => {
    const result = buildIncomeStatement('2026-06-01', '2026-06-30', 10_000_000, 0, 0);
    expect(result.grossProfit).toBe(10_000_000);
    expect(result.netProfit).toBe(10_000_000);
  });

  it('returns negative netProfit when costs exceed revenue (loss)', () => {
    const result = buildIncomeStatement('2026-06-01', '2026-06-30', 5_000_000, 4_000_000, 3_000_000);
    expect(result.grossProfit).toBe(1_000_000);
    expect(result.netProfit).toBe(-2_000_000);
  });
});

// ---- countNewReturningCustomers (pure) ----

describe('countNewReturningCustomers', () => {
  it('splits mixed rows correctly', () => {
    const rows = [
      { customer_type: 'new' },
      { customer_type: 'returning' },
      { customer_type: 'new' },
      { customer_type: 'returning' },
      { customer_type: 'returning' },
    ];
    const result = countNewReturningCustomers(rows);
    expect(result.newCustomers).toBe(2);
    expect(result.returningCustomers).toBe(3);
  });

  it('returns all new when no returning rows', () => {
    const rows = [{ customer_type: 'new' }, { customer_type: 'new' }];
    const result = countNewReturningCustomers(rows);
    expect(result.newCustomers).toBe(2);
    expect(result.returningCustomers).toBe(0);
  });

  it('returns all returning when no new rows', () => {
    const rows = [{ customer_type: 'returning' }];
    const result = countNewReturningCustomers(rows);
    expect(result.newCustomers).toBe(0);
    expect(result.returningCustomers).toBe(1);
  });
});

// ---- getDashboard (mocked repo) ----

describe('getDashboard', () => {
  const mockLowStockItem: InventoryItem = {
    id: 'inv-1',
    nama: 'Deterjen',
    satuan: 'kg',
    qtySaatIni: 2,
    hargaRataFifo: 5000,
    stokMinimum: 10,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    isLowStock: true,
  };

  beforeEach(() => {
    vi.mocked(reportRepo.getDashboardRevenue).mockResolvedValue({
      revenueToday: 500_000,
      revenueThisWeek: 3_000_000,
      revenueThisMonth: 12_000_000,
    });
    vi.mocked(reportRepo.getOrdersByStatus).mockResolvedValue([
      { status: 'diterima', count: 3 },
    ]);
    vi.mocked(reportRepo.getTop5Customers).mockResolvedValue([
      { customerId: 'c-1', nama: 'Budi', totalRevenue: 500_000, orderCount: 5 },
    ]);
    vi.mocked(inventoryRepo.findLowStock).mockResolvedValue([mockLowStockItem]);
  });

  it('assembles all dashboard fields from repo responses', async () => {
    const result = await getDashboard(mockDb);

    expect(result.revenueToday).toBe(500_000);
    expect(result.revenueThisWeek).toBe(3_000_000);
    expect(result.revenueThisMonth).toBe(12_000_000);
    expect(result.ordersByStatus).toHaveLength(1);
    expect(result.ordersByStatus[0]?.status).toBe('diterima');
    expect(result.top5Customers).toHaveLength(1);
    expect(result.top5Customers[0]?.nama).toBe('Budi');
    expect(result.lowStockItems).toHaveLength(1);
    expect(result.lowStockItems[0]?.id).toBe('inv-1');
  });
});

// ---- getIncomeStatement (mocked repo) ----

describe('getIncomeStatement', () => {
  it('extracts variabel and tetap costs and delegates to buildIncomeStatement', async () => {
    vi.mocked(reportRepo.getRevenueInRange).mockResolvedValue(25_000_000);
    vi.mocked(reportRepo.getExpensesByLevelInRange).mockResolvedValue([
      { level: 'variabel', total: 8_000_000 },
      { level: 'tetap', total: 3_000_000 },
    ]);

    const result = await getIncomeStatement(mockDb, '2026-06-01', '2026-06-30');

    expect(result.revenue).toBe(25_000_000);
    expect(result.variableCosts).toBe(8_000_000);
    expect(result.fixedCosts).toBe(3_000_000);
    expect(result.grossProfit).toBe(17_000_000);
    expect(result.netProfit).toBe(14_000_000);
  });

  it('defaults missing cost levels to zero', async () => {
    vi.mocked(reportRepo.getRevenueInRange).mockResolvedValue(10_000_000);
    vi.mocked(reportRepo.getExpensesByLevelInRange).mockResolvedValue([]);

    const result = await getIncomeStatement(mockDb, '2026-06-01', '2026-06-30');

    expect(result.variableCosts).toBe(0);
    expect(result.fixedCosts).toBe(0);
    expect(result.netProfit).toBe(10_000_000);
  });
});

// ---- getInventoryReport (mocked repo) ----

describe('getInventoryReport', () => {
  it('computes stockValue per item and totalStockValue', async () => {
    vi.mocked(reportRepo.getInventorySnapshot).mockResolvedValue([
      {
        id: 'inv-1', nama: 'Deterjen', satuan: 'kg',
        qtySaatIni: 50, hargaRataFifo: 5000,
        stokMinimum: 10, isActive: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'inv-2', nama: 'Pewangi', satuan: 'liter',
        qtySaatIni: 20, hargaRataFifo: 15000,
        stokMinimum: 5, isActive: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    const result = await getInventoryReport(mockDb);

    expect(result.items[0]?.stockValue).toBe(250_000);   // 50 * 5000
    expect(result.items[1]?.stockValue).toBe(300_000);   // 20 * 15000
    expect(result.totalStockValue).toBe(550_000);
  });
});

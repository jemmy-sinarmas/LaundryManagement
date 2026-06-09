import type { SqlDb } from '../lib/db-types.js';
import * as reportRepo from '../repositories/report.repo.js';
import * as inventoryRepo from '../repositories/inventory.repo.js';
import type {
  DashboardData,
  DailyReportData,
  MonthlyReportData,
  IncomeStatementData,
  InventoryReportData,
} from '../types/reports.js';

// ---- Pure functions (unit-test targets) ----

export function buildIncomeStatement(
  from: string,
  to: string,
  revenue: number,
  variableCosts: number,
  fixedCosts: number
): IncomeStatementData {
  const grossProfit = revenue - variableCosts;
  const netProfit = grossProfit - fixedCosts;
  return { from, to, revenue, variableCosts, fixedCosts, grossProfit, netProfit };
}

export function countNewReturningCustomers(
  rows: { customer_type: string }[]
): { newCustomers: number; returningCustomers: number } {
  const newCustomers = rows.filter((r) => r.customer_type === 'new').length;
  const returningCustomers = rows.filter((r) => r.customer_type === 'returning').length;
  return { newCustomers, returningCustomers };
}

// ---- Service orchestrators ----

export async function getDashboard(db: SqlDb, branchId?: string | null): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';

  const [revenue, ordersByStatus, top5Customers, lowStockItems] = await Promise.all([
    reportRepo.getDashboardRevenue(db, today, branchId),
    reportRepo.getOrdersByStatus(db, branchId),
    reportRepo.getTop5Customers(db, monthStart, branchId),
    inventoryRepo.findLowStock(db, branchId),
  ]);

  return {
    revenueToday: revenue.revenueToday,
    revenueThisWeek: revenue.revenueThisWeek,
    revenueThisMonth: revenue.revenueThisMonth,
    ordersByStatus,
    top5Customers,
    lowStockItems,
  };
}

export async function getDailyReport(db: SqlDb, date: string, branchId?: string | null): Promise<DailyReportData> {
  const [orders, totalRevenue, totalExpenses] = await Promise.all([
    reportRepo.getDailyOrders(db, date, branchId),
    reportRepo.getDailyRevenue(db, date, branchId),
    reportRepo.getDailyExpenses(db, date, branchId),
  ]);

  return {
    date,
    orders,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

export async function getMonthlyReport(
  db: SqlDb,
  year: number,
  month: number,
  branchId?: string | null
): Promise<MonthlyReportData> {
  const [revenueByDay, revenueByItemType, customerTypeRows] = await Promise.all([
    reportRepo.getMonthlyRevenueByDay(db, year, month, branchId),
    reportRepo.getMonthlyRevenueByItemType(db, year, month, branchId),
    reportRepo.getMonthlyCustomerTypes(db, year, month, branchId),
  ]);

  const totalRevenue = revenueByDay.reduce((s, r) => s + r.revenue, 0);
  const { newCustomers, returningCustomers } = countNewReturningCustomers(customerTypeRows);

  return {
    year,
    month,
    totalRevenue,
    revenueByDay,
    revenueByItemType,
    newCustomers,
    returningCustomers,
  };
}

export async function getIncomeStatement(
  db: SqlDb,
  from: string,
  to: string,
  branchId?: string | null
): Promise<IncomeStatementData> {
  const [revenue, expensesByLevel] = await Promise.all([
    reportRepo.getRevenueInRange(db, from, to, branchId),
    reportRepo.getExpensesByLevelInRange(db, from, to, branchId),
  ]);

  const variableCosts = expensesByLevel.find((r) => r.level === 'variabel')?.total ?? 0;
  const fixedCosts = expensesByLevel.find((r) => r.level === 'tetap')?.total ?? 0;

  return buildIncomeStatement(from, to, revenue, variableCosts, fixedCosts);
}

export async function getInventoryReport(db: SqlDb, branchId?: string | null): Promise<InventoryReportData> {
  const rows = await reportRepo.getInventorySnapshot(db);
  const filtered = branchId ? rows.filter((r) => r.branchId === branchId) : rows;
  const items = filtered.map((r) => ({
    ...r,
    isLowStock: r.qtySaatIni <= r.stokMinimum,
    stockValue: r.qtySaatIni * r.hargaRataFifo,
  }));
  const totalStockValue = items.reduce((s, i) => s + i.stockValue, 0);
  return { items, totalStockValue };
}

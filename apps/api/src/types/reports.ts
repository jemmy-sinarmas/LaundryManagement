import type { InventoryItem } from '@laundry-palu/shared';

export type DashboardData = {
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  ordersByStatus: { status: string; count: number }[];
  top5Customers: { customerId: string; nama: string; totalRevenue: number; orderCount: number }[];
  lowStockItems: InventoryItem[];
};

export type DailyReportData = {
  date: string;
  orders: { invoiceNo: string; customerNama: string; total: number; status: string }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
};

export type MonthlyReportData = {
  year: number;
  month: number;
  totalRevenue: number;
  revenueByDay: { date: string; revenue: number }[];
  revenueByItemType: { tipe: string; totalRevenue: number }[];
  newCustomers: number;
  returningCustomers: number;
};

export type IncomeStatementData = {
  from: string;
  to: string;
  revenue: number;
  variableCosts: number;
  fixedCosts: number;
  grossProfit: number;
  netProfit: number;
};

export type InventoryReportData = {
  items: Array<InventoryItem & { stockValue: number }>;
  totalStockValue: number;
};

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

export type SalesReportData = {
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  byServiceType: { tipe: string; revenue: number; qty: number }[];
  topItems: { namaItem: string; tipe: string; revenue: number; qty: number }[];
};

export type TransactionItem = {
  id: string;
  invoiceNo: string;
  customerNama: string;
  branchId: string | null;
  status: string;
  total: number;
  createdAt: string;
};

export type TransactionsReportData = {
  from: string;
  to: string;
  count: number;
  orders: TransactionItem[];
};

export type InvoiceItem = {
  id: string;
  invoiceNo: string;
  customerNama: string;
  branchId: string | null;
  status: string;
  total: number;
  createdAt: string;
};

export type InvoicesReportData = {
  from: string;
  to: string;
  count: number;
  invoices: InvoiceItem[];
};

export type ShiftReportItem = {
  id: string;
  kasirNama: string;
  kasirUsername: string;
  branchNama: string;
  startTime: string;
  endTime: string | null;
  startCash: number;
  endCash: number | null;
  notes: string | null;
  orderCount: number;
};

export type ShiftsReportData = {
  from: string;
  to: string;
  shifts: ShiftReportItem[];
};

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { InventoryItem } from '@laundry-palu/shared';

// ---- Shared response types (mirrors apps/api/src/types/reports.ts) ----

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

// ---- Hooks ----

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    Promise.all([
      api.get<DashboardData>('/api/v1/reports/dashboard'),
      api.get<MonthlyReportData>(`/api/v1/reports/monthly?year=${year}&month=${month}`),
    ])
      .then(([d, m]) => { setData(d); setMonthlyData(m); })
      .catch(() => setError('Gagal memuat data dasbor'))
      .finally(() => setLoading(false));
  }, []);

  return { data, monthlyData, loading, error };
}

export function useDailyReport(date: string) {
  const [data, setData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<DailyReportData>(`/api/v1/reports/daily?date=${d}`);
      setData(result);
    } catch {
      setError('Gagal memuat laporan harian');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(date); }, [fetch, date]);

  return { data, loading, error, refetch: fetch };
}

export function useMonthlyReport(year: number, month: number) {
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get<MonthlyReportData>(`/api/v1/reports/monthly?year=${year}&month=${month}`)
      .then(setData)
      .catch(() => setError('Gagal memuat laporan bulanan'))
      .finally(() => setLoading(false));
  }, [year, month]);

  return { data, loading, error };
}

export function useIncomeStatement(from: string, to: string) {
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<IncomeStatementData>(
        `/api/v1/reports/income-statement?from=${f}&to=${t}`
      );
      setData(result);
    } catch {
      setError('Gagal memuat laporan laba rugi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(from, to); }, [fetch, from, to]);

  return { data, loading, error, refetch: fetch };
}

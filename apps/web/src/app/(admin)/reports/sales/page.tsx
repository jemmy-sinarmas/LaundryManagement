'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { DatePeriodFilter, computePreset } from '@/components/DatePeriodFilter';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useLangStore } from '@/store/langStore';
import type { DateRange } from '@/components/DatePeriodFilter';

const TIPE_LABELS: Record<string, string> = {
  kiloan:    'Kiloan',
  satuan:    'Satuan',
  jasa_lain: 'Jasa Lain',
};

type SalesData = {
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  byServiceType: { tipe: string; revenue: number; qty: number }[];
  topItems: { namaItem: string; tipe: string; revenue: number; qty: number }[];
};

export default function SalesReportPage() {
  const { t } = useLangStore();
  const [range, setRange] = useState<DateRange>(computePreset('this_month'));
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<SalesData>(`/api/v1/reports/sales?from=${r.from}&to=${r.to}`);
      setData(result);
    } catch {
      setError('Gagal memuat laporan penjualan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(range); }, [fetchData, range]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t.reports.title, href: '/reports' }, { label: t.reports.sales }]} />
      <h1 className="text-2xl font-bold text-gray-900">{t.reports.sales}</h1>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <DatePeriodFilter value={range} onChange={(r) => { setRange(r); }} />
      </div>

      {loading && <p className="text-sm text-gray-400">{t.common.loading}</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Pendapatan', value: formatIDR(data.totalRevenue) },
              { label: 'Total Pesanan Selesai', value: String(data.totalOrders) },
              { label: 'Rata-rata per Pesanan', value: formatIDR(data.avgOrderValue) },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border bg-white p-5 shadow-sm">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
              </div>
            ))}
          </div>

          {/* By service type */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b px-5 py-3">
              <h2 className="font-semibold text-gray-900">Pendapatan per Jenis Layanan</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Jenis', 'Pendapatan', 'Qty'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.byServiceType.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-6 text-center text-sm text-gray-400">Tidak ada data</td></tr>
                ) : (
                  data.byServiceType.map((row) => (
                    <tr key={row.tipe} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{TIPE_LABELS[row.tipe] ?? row.tipe}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{formatIDR(row.revenue)}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{row.qty}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Top items */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b px-5 py-3">
              <h2 className="font-semibold text-gray-900">Top 10 Item Terlaris</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Nama Item', 'Jenis', 'Pendapatan', 'Qty'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">Tidak ada data</td></tr>
                ) : (
                  data.topItems.map((item, i) => (
                    <tr key={item.namaItem} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{item.namaItem}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{TIPE_LABELS[item.tipe] ?? item.tipe}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{formatIDR(item.revenue)}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{item.qty}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

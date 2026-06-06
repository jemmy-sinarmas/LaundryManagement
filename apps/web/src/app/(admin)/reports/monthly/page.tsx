'use client';
import { useState } from 'react';
import { useMonthlyReport } from '@/hooks/useReports';
import { formatIDR } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

const ITEM_TYPE_LABELS: Record<string, string> = {
  satuan: 'Per Satuan', kiloan: 'Kiloan', jasa_lain: 'Jasa Lain',
};
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function MonthlyReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data, loading, error } = useMonthlyReport(year, month);

  const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  const chartData = (data?.revenueByDay ?? []).map((d) => ({
    date: d.date.slice(8), // day number
    revenue: Math.round(d.revenue / 1000),
  }));

  const pieData = (data?.revenueByItemType ?? []).map((d) => ({
    name: ITEM_TYPE_LABELS[d.tipe] ?? d.tipe,
    value: d.totalRevenue,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan</h1>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2020} max={2100}
            className="w-24 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Memuat...</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total Pendapatan</p>
              <p className="mt-1 text-xl font-bold text-blue-700">{formatIDR(data.totalRevenue)}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Pelanggan Baru</p>
              <p className="mt-1 text-xl font-bold text-green-700">{data.newCustomers}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Pelanggan Kembali</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{data.returningCustomers}</p>
            </div>
          </div>

          {/* Revenue by day bar chart */}
          {chartData.length > 0 && (
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Pendapatan per Hari (ribuan IDR)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`Rp ${v}k`, 'Pendapatan']} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue by item type pie chart */}
          {pieData.length > 0 && (
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Pendapatan per Tipe Layanan</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                  <Tooltip formatter={(v: number) => formatIDR(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

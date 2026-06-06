'use client';
import { useDashboard } from '@/hooks/useReports';
import StockAlert from '@/components/inventory/StockAlert';
import { formatIDR } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  diterima: 'Diterima', dicuci: 'Dicuci', dikeringkan: 'Dikeringkan',
  dibungkus: 'Dibungkus', siap_diambil: 'Siap Diambil',
};
const STATUS_COLORS: Record<string, string> = {
  diterima: 'bg-gray-100 text-gray-700', dicuci: 'bg-blue-100 text-blue-700',
  dikeringkan: 'bg-yellow-100 text-yellow-700', dibungkus: 'bg-purple-100 text-purple-700',
  siap_diambil: 'bg-green-100 text-green-700',
};

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, monthlyData, loading, error } = useDashboard();

  if (loading) return <p className="text-sm text-gray-400">Memuat dasbor...</p>;
  if (error || !data) return (
    <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error ?? 'Gagal memuat data'}
    </div>
  );

  const chartData = (monthlyData?.revenueByDay ?? []).map((d) => ({
    date: d.date.slice(5), // MM-DD
    revenue: d.revenue / 1000, // in thousands for readability
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dasbor</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Pendapatan Hari Ini" value={formatIDR(data.revenueToday)} />
        <KpiCard label="Pendapatan Minggu Ini" value={formatIDR(data.revenueThisWeek)} />
        <KpiCard label="Pendapatan Bulan Ini" value={formatIDR(data.revenueThisMonth)} />
      </div>

      {/* Orders by status */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Status Pesanan Aktif</h2>
        {data.ordersByStatus.length === 0 ? (
          <p className="text-sm text-gray-400">Tidak ada pesanan aktif.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data.ordersByStatus.map(({ status, count }) => (
              <div
                key={status}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                  STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                <span>{STATUS_LABELS[status] ?? status}</span>
                <span className="rounded-full bg-white/60 px-1.5 text-xs font-bold">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Pendapatan Bulan Ini (ribuan IDR)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`Rp ${v.toFixed(0)}k`, 'Pendapatan']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 customers */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Top 5 Pelanggan (Bulan Ini)</h2>
          {data.top5Customers.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {data.top5Customers.map((c, i) => (
                <div key={c.customerId} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-gray-400">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{c.nama}</p>
                    <p className="text-xs text-gray-400">{c.orderCount} pesanan</p>
                  </div>
                  <span className="text-sm font-medium text-blue-700">{formatIDR(c.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div>
          {data.lowStockItems.length > 0 ? (
            <StockAlert items={data.lowStockItems} />
          ) : (
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-gray-900">Stok Inventori</h2>
              <p className="text-sm text-green-700">Semua stok dalam kondisi aman.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

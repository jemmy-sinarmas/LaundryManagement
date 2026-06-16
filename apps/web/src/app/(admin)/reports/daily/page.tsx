'use client';
import { useState } from 'react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useDailyReport } from '@/hooks/useReports';
import { useLangStore } from '@/store/langStore';
import { formatIDR } from '@/lib/utils';
import { Printer } from 'lucide-react';

export default function DailyReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data, loading, error } = useDailyReport(date);
  const { t } = useLangStore();

  return (
    <div>
      <Breadcrumb items={[{ label: t.reports.title, href: '/reports' }, { label: t.reports.daily }]} />
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">{t.reports.daily}</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer size={15} />
            Cetak
          </button>
        </div>
      </div>

      {/* Print header (hidden on screen) */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">{t.app.name} — {t.reports.daily}</h1>
        <p className="text-sm text-gray-500">Tanggal: {date}</p>
      </div>

      {loading && <p className="text-sm text-gray-400">{t.common.loading}</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 print:gap-2">
            {[
              { label: 'Total Pendapatan', value: formatIDR(data.totalRevenue), color: 'text-green-700' },
              { label: 'Total Pengeluaran', value: formatIDR(data.totalExpenses), color: 'text-red-600' },
              { label: 'Laba Bersih', value: formatIDR(data.netIncome), color: data.netIncome >= 0 ? 'text-blue-700' : 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border bg-white p-4 shadow-sm print:shadow-none">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Orders table */}
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm print:shadow-none">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Pesanan Selesai ({data.orders.length})
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['No. Invoice', 'Pelanggan', 'Total', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.orders.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">Tidak ada pesanan selesai hari ini.</td></tr>
                ) : (
                  data.orders.map((o) => (
                    <tr key={o.invoiceNo}>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{o.invoiceNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{o.customerNama}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatIDR(o.total)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{o.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

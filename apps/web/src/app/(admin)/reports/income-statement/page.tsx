'use client';
import { useState } from 'react';
import { useIncomeStatement } from '@/hooks/useReports';
import { formatIDR } from '@/lib/utils';
import { Printer } from 'lucide-react';

export default function IncomeStatementPage() {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [applied, setApplied] = useState({ from: firstOfMonth, to: today });

  const { data, loading, error } = useIncomeStatement(applied.from, applied.to);

  function apply() { setApplied({ from, to }); }

  type Row = { label: string; value: number; indent?: boolean; bold?: boolean; color?: string; separator?: boolean };
  const rows: Row[] = data
    ? [
        { label: 'Pendapatan', value: data.revenue, bold: true },
        { label: 'Biaya Variabel', value: data.variableCosts, indent: true, color: 'text-red-600' },
        { label: 'Laba Kotor', value: data.grossProfit, bold: true, separator: true },
        { label: 'Biaya Tetap', value: data.fixedCosts, indent: true, color: 'text-red-600' },
        { label: 'Laba Bersih', value: data.netProfit, bold: true, separator: true,
          color: data.netProfit >= 0 ? 'text-green-700' : 'text-red-600' },
      ]
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Laba Rugi</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Printer size={15} />
          Cetak
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Laundry Palu — Laporan Laba Rugi</h1>
        <p className="text-sm text-gray-500">{applied.from} s/d {applied.to}</p>
      </div>

      {/* Date range */}
      <div className="mb-6 flex items-end gap-3 print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Dari</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Sampai</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
        </div>
        <button onClick={apply}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Tampilkan
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Memuat...</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="max-w-lg rounded-lg border bg-white shadow-sm print:shadow-none">
          <div className="border-b px-6 py-4">
            <p className="text-xs text-gray-500">Periode: {data.from} s/d {data.to}</p>
          </div>
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.label}
                className={`flex items-center justify-between px-6 py-3 ${
                  row.separator ? 'border-t-2 border-gray-200' : ''
                }`}
              >
                <span className={`text-sm ${row.bold ? 'font-semibold text-gray-900' : 'text-gray-600'} ${row.indent ? 'pl-4' : ''}`}>
                  {row.label}
                </span>
                <span className={`text-sm font-medium ${row.color ?? 'text-gray-900'}`}>
                  {row.label.startsWith('Biaya') ? `(${formatIDR(row.value)})` : formatIDR(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

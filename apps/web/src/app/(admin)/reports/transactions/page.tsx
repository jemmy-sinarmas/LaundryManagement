'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR, formatDate } from '@/lib/utils';
import { DatePeriodFilter, computePreset } from '@/components/DatePeriodFilter';
import type { DateRange } from '@/components/DatePeriodFilter';
import { ORDER_STATUSES } from '@laundry-palu/shared';

const STATUS_LABELS: Record<string, string> = {
  diterima:     'Diterima',
  dicuci:       'Dicuci',
  dikeringkan:  'Dikeringkan',
  dibungkus:    'Dibungkus',
  siap_diambil: 'Siap Diambil',
  selesai:      'Selesai',
};

const STATUS_COLORS: Record<string, string> = {
  diterima:     'bg-gray-100 text-gray-700',
  dicuci:       'bg-blue-100 text-blue-700',
  dikeringkan:  'bg-yellow-100 text-yellow-700',
  dibungkus:    'bg-purple-100 text-purple-700',
  siap_diambil: 'bg-green-100 text-green-700',
  selesai:      'bg-green-600 text-white',
};

type TransactionItem = {
  id: string;
  invoiceNo: string;
  customerNama: string;
  branchId: string | null;
  status: string;
  total: number;
  createdAt: string;
};

type TransactionsData = {
  from: string;
  to: string;
  count: number;
  orders: TransactionItem[];
};

export default function TransactionsReportPage() {
  const [range, setRange] = useState<DateRange>(computePreset('this_month'));
  const [filterStatus, setFilterStatus] = useState('');
  const [data, setData] = useState<TransactionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: DateRange, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: r.from, to: r.to });
      if (status) params.set('status', status);
      const result = await api.get<TransactionsData>(`/api/v1/reports/transactions?${params.toString()}`);
      setData(result);
    } catch {
      setError('Gagal memuat laporan transaksi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(range, filterStatus); }, [fetchData, range, filterStatus]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Laporan Transaksi</h1>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <DatePeriodFilter value={range} onChange={setRange} />
        <div className="mt-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Semua Status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Memuat...</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-semibold text-gray-900">Transaksi</h2>
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
              {data.count} pesanan
            </span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['No. Faktur', 'Pelanggan', 'Status', 'Total', 'Tanggal'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.orders.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Tidak ada transaksi dalam periode ini.</td></tr>
              ) : (
                data.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-900">{o.invoiceNo}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{o.customerNama}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{formatIDR(o.total)}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{formatDate(o.createdAt, 'id')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

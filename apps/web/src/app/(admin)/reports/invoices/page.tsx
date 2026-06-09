'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { formatIDR, formatDate } from '@/lib/utils';
import { DatePeriodFilter, computePreset } from '@/components/DatePeriodFilter';
import type { DateRange } from '@/components/DatePeriodFilter';
import PrintableInvoice from '@/components/invoice/PrintableInvoice';
import type { Order } from '@laundry-palu/shared';
import { FileText } from 'lucide-react';

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

type InvoiceItem = {
  id: string;
  invoiceNo: string;
  customerNama: string;
  branchId: string | null;
  status: string;
  total: number;
  createdAt: string;
};

type InvoicesData = {
  from: string;
  to: string;
  count: number;
  invoices: InvoiceItem[];
};

export default function InvoicesReportPage() {
  const [range, setRange] = useState<DateRange>(computePreset('this_month'));
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [data, setData] = useState<InvoicesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (r: DateRange, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: r.from, to: r.to });
      if (q) params.set('q', q);
      const result = await api.get<InvoicesData>(`/api/v1/reports/invoices?${params.toString()}`);
      setData(result);
    } catch {
      setError('Gagal memuat laporan faktur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(range, appliedSearch); }, [fetchData, range, appliedSearch]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setAppliedSearch(value), 400);
  }

  async function handlePreview(id: string) {
    setLoadingPreview(id);
    try {
      const order = await api.get<Order>(`/api/v1/orders/${id}`);
      setPreviewOrder(order);
    } catch {
      // silent
    } finally {
      setLoadingPreview(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Laporan Faktur</h1>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <DatePeriodFilter value={range} onChange={setRange} />
        <input
          type="text"
          placeholder="Cari no. faktur atau nama pelanggan..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading && <p className="text-sm text-gray-400">Memuat...</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-semibold text-gray-900">Faktur</h2>
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
              {data.count} faktur
            </span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['No. Faktur', 'Pelanggan', 'Status', 'Total', 'Tanggal', 'Aksi'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Tidak ada faktur dalam periode ini.</td></tr>
              ) : (
                data.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-900">{inv.invoiceNo}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{inv.customerNama}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{formatIDR(inv.total)}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{formatDate(inv.createdAt, 'id')}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => void handlePreview(inv.id)}
                        disabled={loadingPreview === inv.id}
                        className="flex items-center gap-1 rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        <FileText size={12} />
                        {loadingPreview === inv.id ? '...' : 'Nota'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {previewOrder && (
        <PrintableInvoice order={previewOrder} onClose={() => setPreviewOrder(null)} />
      )}
    </div>
  );
}

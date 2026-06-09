'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import type { Order, Branch } from '@laundry-palu/shared';
import { ORDER_STATUSES } from '@laundry-palu/shared';
import PrintableInvoice from '@/components/invoice/PrintableInvoice';
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterBranch) params.set('branch_id', filterBranch);
      if (filterStatus) params.set('status', filterStatus);
      const qs = params.size > 0 ? `?${params.toString()}` : '';
      const data = await api.get<Order[]>(`/api/v1/orders${qs}`);
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterBranch, filterStatus]);

  useEffect(() => {
    api.get<Branch[]>('/api/v1/branches').then(setBranches).catch(() => undefined);
  }, []);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  async function handlePreview(order: Order) {
    setLoadingPreview(order.id);
    try {
      const full = await api.get<Order>(`/api/v1/orders/${order.id}`);
      setPreviewOrder(full);
    } catch {
      // silent
    } finally {
      setLoadingPreview(null);
    }
  }

  const filtered = orders.filter((o) => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return (
      o.invoiceNo.toLowerCase().includes(q) ||
      (o.customer?.nama ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Semua Pesanan</h1>
        <button
          onClick={() => void fetchOrders()}
          className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari invoice / pelanggan..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Semua Cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.nama}</option>
          ))}
        </select>
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

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Invoice', 'Pelanggan', 'Cabang', 'Status', 'Total', 'Tanggal', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Memuat...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada pesanan.</td></tr>
            ) : (
              filtered.map((order) => {
                const branch = branches.find((b) => b.id === order.branchId);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{order.invoiceNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.customer?.nama ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{branch?.nama ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatIDR(order.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{order.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handlePreview(order)}
                        disabled={loadingPreview === order.id}
                        className="flex items-center gap-1.5 rounded border px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <FileText size={12} />
                        {loadingPreview === order.id ? '...' : 'Preview Nota'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {previewOrder && (
        <PrintableInvoice order={previewOrder} onClose={() => setPreviewOrder(null)} />
      )}
    </div>
  );
}

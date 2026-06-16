'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { useLangStore } from '@/store/langStore';
import { toast } from '@/store/toastStore';
import type { Order, Branch } from '@laundry-palu/shared';
import { ORDER_STATUSES } from '@laundry-palu/shared';
import PrintableInvoice from '@/components/invoice/PrintableInvoice';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { FileText } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  diterima:     'bg-gray-100 text-gray-700',
  dicuci:       'bg-blue-100 text-blue-700',
  dikeringkan:  'bg-yellow-100 text-yellow-700',
  dibungkus:    'bg-purple-100 text-purple-700',
  siap_diambil: 'bg-green-100 text-green-700',
  selesai:      'bg-green-600 text-white',
};

export default function AdminOrdersPage() {
  const { t } = useLangStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const fetchOrders = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(p), limit: '100' });
      if (filterBranch) params.set('branch_id', filterBranch);
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get<{ data: Order[]; hasMore: boolean }>(`/api/v1/orders?${params.toString()}`);
      setOrders(res.data);
      setHasMore(res.hasMore);
    } catch {
      toast.error(t.orders.error_load);
    } finally {
      setLoading(false);
    }
  }, [filterBranch, filterStatus]);

  useEffect(() => {
    api.get<Branch[]>('/api/v1/branches').then(setBranches).catch(() => undefined);
  }, []);

  useEffect(() => { setPage(1); }, [filterBranch, filterStatus]);
  useEffect(() => { void fetchOrders(page); }, [fetchOrders, page]);

  async function handlePreview(order: Order) {
    setLoadingPreview(order.id);
    try {
      const full = await api.get<Order>(`/api/v1/orders/${order.id}`);
      setPreviewOrder(full);
    } catch {
      toast.error(t.common.error);
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
        <h1 className="text-2xl font-bold text-gray-900">{t.orders.title}</h1>
        <button
          onClick={() => void fetchOrders(page)}
          className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t.common.refresh}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t.orders.search_placeholder}
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t.orders.filter_branch}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.nama}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t.orders.filter_status}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{t.status[s as keyof typeof t.status] ?? s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[t.orders.invoice, t.orders.customer, t.orders.branch, t.common.status, t.orders.total, t.orders.date, t.common.actions].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton cols={7} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  {filterSearch || filterBranch || filterStatus
                    ? t.orders.empty_filtered
                    : (
                      <span>
                        {t.orders.empty}{' '}
                        <a href="/pos" className="text-blue-600 hover:underline">{t.orders.cta_pos}</a>
                      </span>
                    )
                  }
                </td>
              </tr>
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
                        {t.status[order.status as keyof typeof t.status] ?? order.status}
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
                        {loadingPreview === order.id ? '...' : t.orders.preview}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && (page > 1 || hasMore) && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>{t.common.page} {page}{hasMore ? '+' : ''}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              ← {t.common.prev}
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore || filterSearch !== ''}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              {t.common.next} →
            </button>
          </div>
        </div>
      )}

      {previewOrder && (
        <PrintableInvoice order={previewOrder} onClose={() => setPreviewOrder(null)} />
      )}
    </div>
  );
}

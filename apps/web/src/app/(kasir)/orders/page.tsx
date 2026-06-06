'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@laundry-palu/shared';
import { ORDER_STATUSES } from '@laundry-palu/shared';

const STATUS_LABELS: Record<string, string> = {
  diterima:      'Diterima',
  dicuci:        'Dicuci',
  dikeringkan:   'Dikeringkan',
  dibungkus:     'Dibungkus',
  siap_diambil:  'Siap Diambil',
  selesai:       'Selesai',
};

const STATUS_COLORS: Record<string, string> = {
  diterima:     'bg-gray-100 text-gray-700',
  dicuci:       'bg-blue-100 text-blue-700',
  dikeringkan:  'bg-yellow-100 text-yellow-700',
  dibungkus:    'bg-purple-100 text-purple-700',
  siap_diambil: 'bg-green-100 text-green-700',
  selesai:      'bg-green-600 text-white',
};

export default function KasirOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Order[]>('/api/v1/orders');
      setOrders(data);
    } catch {
      // silent — table stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  async function advanceStatus(order: Order) {
    const currentIdx = ORDER_STATUSES.indexOf(order.status);
    const nextStatus = ORDER_STATUSES[currentIdx + 1];
    if (!nextStatus) return;

    setUpdating(order.id);
    try {
      const updated = await api.patch<Order>(`/api/v1/orders/${order.id}/status`, {
        status: nextStatus,
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch {
      // silent — status unchanged
    } finally {
      setUpdating(null);
    }
  }

  const activeOrders = orders.filter((o) => o.status !== 'selesai');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Aktif</h1>
        <button
          onClick={() => void fetchOrders()}
          className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Invoice', 'Pelanggan', 'Total', 'Status', 'Aksi'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  Memuat...
                </td>
              </tr>
            ) : activeOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  Tidak ada pesanan aktif.
                </td>
              </tr>
            ) : (
              activeOrders.map((order) => {
                const currentIdx = ORDER_STATUSES.indexOf(order.status);
                const nextStatus = ORDER_STATUSES[currentIdx + 1];
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                      {order.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {order.customer?.nama ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatIDR(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {nextStatus && (
                        <button
                          onClick={() => void advanceStatus(order)}
                          disabled={updating === order.id}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updating === order.id
                            ? '...'
                            : `→ ${STATUS_LABELS[nextStatus] ?? nextStatus}`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { useLangStore } from '@/store/langStore';
import { toast } from '@/store/toastStore';
import type { Order } from '@laundry-palu/shared';
import { ORDER_STATUSES, getPreviousStatus } from '@laundry-palu/shared';
import { X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  diterima:     'bg-gray-100 text-gray-700',
  dicuci:       'bg-blue-100 text-blue-700',
  dikeringkan:  'bg-yellow-100 text-yellow-700',
  dibungkus:    'bg-purple-100 text-purple-700',
  siap_diambil: 'bg-green-100 text-green-700',
  selesai:      'bg-green-600 text-white',
};

function RevertModal({
  order,
  onConfirm,
  onClose,
}: {
  order: Order;
  onConfirm: (catatan: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLangStore();
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousStatus = getPreviousStatus(order.status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catatan.trim()) { setError(t.antrian.revert_required); return; }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(catatan.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.antrian.revert_error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.antrian.revert_title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Status akan diubah dari{' '}
          <span className="font-medium">{t.status[order.status as keyof typeof t.status] ?? order.status}</span>
          {' '}kembali ke{' '}
          <span className="font-medium text-orange-600">
            {previousStatus ? (t.status[previousStatus as keyof typeof t.status] ?? previousStatus) : '—'}
          </span>
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t.antrian.revert_reason} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder={t.antrian.revert_placeholder}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !catatan.trim()}
              className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? t.common.processing : t.antrian.revert_confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KasirOrdersPage() {
  const { t } = useLangStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [revertOrder, setRevertOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Order[] }>('/api/v1/orders?limit=200');
      setOrders(res.data);
    } catch {
      toast.error(t.orders.error_load);
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
      toast.error(t.common.error);
    } finally {
      setUpdating(null);
    }
  }

  async function revertStatus(order: Order, catatan: string) {
    setUpdating(order.id);
    try {
      const updated = await api.post<Order>(`/api/v1/orders/${order.id}/revert-status`, { catatan });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } finally {
      setUpdating(null);
    }
  }

  const activeOrders = orders.filter((o) => o.status !== 'selesai');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.antrian.title}</h1>
        <button
          onClick={() => void fetchOrders()}
          className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t.antrian.refresh}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Invoice', t.nav.customers, t.pos.total, t.common.status, t.common.actions].map((h) => (
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
                  {t.common.loading}
                </td>
              </tr>
            ) : activeOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  {t.antrian.empty}{' '}
                  <a href="/pos" className="text-blue-600 hover:underline">
                    {t.antrian.cta_pos}
                  </a>
                </td>
              </tr>
            ) : (
              activeOrders.map((order) => {
                const currentIdx = ORDER_STATUSES.indexOf(order.status);
                const nextStatus = ORDER_STATUSES[currentIdx + 1];
                const prevStatus = getPreviousStatus(order.status);
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
                        {t.status[order.status as keyof typeof t.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {nextStatus && (
                          <button
                            onClick={() => void advanceStatus(order)}
                            disabled={updating === order.id}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updating === order.id
                              ? '...'
                              : `${t.antrian.advance} ${t.status[nextStatus as keyof typeof t.status] ?? nextStatus}`}
                          </button>
                        )}
                        {prevStatus && (
                          <button
                            onClick={() => setRevertOrder(order)}
                            disabled={updating === order.id}
                            className="rounded border border-orange-300 px-3 py-1 text-xs text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                          >
                            Batalkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {revertOrder && (
        <RevertModal
          order={revertOrder}
          onConfirm={async (catatan) => { await revertStatus(revertOrder, catatan); }}
          onClose={() => setRevertOrder(null)}
        />
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@laundry-palu/shared';
import { ORDER_STATUSES } from '@laundry-palu/shared';
import { CheckCircle, Circle, ArrowLeft, Package, RefreshCw } from 'lucide-react';

const STATUS_LABELS_ID: Record<string, string> = {
  diterima: 'Diterima', dicuci: 'Sedang Dicuci', dikeringkan: 'Sedang Dikeringkan',
  dibungkus: 'Sedang Dibungkus', siap_diambil: 'Siap Diambil', selesai: 'Selesai',
};
const STATUS_LABELS_EN: Record<string, string> = {
  diterima: 'Received', dicuci: 'Washing', dikeringkan: 'Drying',
  dibungkus: 'Packing', siap_diambil: 'Ready for Pickup', selesai: 'Completed',
};

export default function TrackDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [lang, setLang] = useState<'id' | 'en'>(() => {
    if (typeof window === 'undefined') return 'id';
    return (localStorage.getItem('track-lang') as 'id' | 'en') ?? 'id';
  });

  const STATUS_LABELS = lang === 'id' ? STATUS_LABELS_ID : STATUS_LABELS_EN;

  function toggleLang() {
    const next = lang === 'id' ? 'en' : 'id';
    setLang(next);
    localStorage.setItem('track-lang', next);
  }

  const fetchOrder = useCallback(async () => {
    if (!invoiceId) return;
    try {
      const data = await api.get<Order>(`/api/v1/track/${encodeURIComponent(invoiceId)}`);
      setOrder(data);
      setNotFound(false);
    } catch {
      setNotFound(true);
    }
  }, [invoiceId]);

  useEffect(() => {
    void fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchOrder();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Memuat...</p>
      </main>
    );
  }

  if (notFound || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
          <Package size={40} className="mx-auto mb-4 text-gray-300" />
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Pesanan Tidak Ditemukan</h2>
          <p className="mb-4 text-sm text-gray-500">
            Invoice <span className="font-mono">{invoiceId}</span> tidak ada dalam sistem kami.
          </p>
          <Link href="/track" className="text-sm text-blue-600 hover:underline">
            ← Cari pesanan lain
          </Link>
        </div>
      </main>
    );
  }

  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const isReady = order.status === 'siap_diambil';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Back + refresh + lang toggle */}
        <div className="flex items-center justify-between">
          <Link href="/track" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft size={14} /> Kembali
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              title={lang === 'id' ? 'Perbarui status' : 'Refresh status'}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {lang === 'id' ? 'Perbarui' : 'Refresh'}
            </button>
            <button
              onClick={toggleLang}
              className="rounded border px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              {lang === 'id' ? 'EN' : 'ID'}
            </button>
          </div>
        </div>

        {/* Ready banner */}
        {isReady && (
          <div className="rounded-xl border border-green-300 bg-green-50 px-5 py-4 text-center">
            <p className="text-lg font-bold text-green-800">
              {lang === 'id' ? '✅ Pakaian Anda Siap Diambil!' : '✅ Your Laundry is Ready for Pickup!'}
            </p>
          </div>
        )}

        {/* Order header */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">{lang === 'id' ? 'No. Invoice' : 'Invoice No.'}</p>
              <p className="font-mono text-base font-bold text-gray-900">{order.invoiceNo}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isReady ? 'bg-green-100 text-green-800' :
              order.status === 'selesai' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          {order.customer && (
            <p className="text-sm text-gray-600">
              {lang === 'id' ? 'Pelanggan' : 'Customer'}: <span className="font-medium text-gray-900">{order.customer.nama}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">{order.createdAt.slice(0, 10)}</p>
        </div>

        {/* Progress stepper */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            {lang === 'id' ? 'Status Pesanan' : 'Order Status'}
          </h2>
          <div className="relative">
            {/* Track line */}
            <div className="absolute left-3.5 top-4 h-[calc(100%-2rem)] w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {ORDER_STATUSES.map((status, i) => {
                const done = i <= currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={status} className="relative flex items-start gap-3">
                    <div className={`relative z-10 flex-shrink-0 rounded-full ${
                      done ? 'text-blue-600' : 'text-gray-300'
                    }`}>
                      {done ? <CheckCircle size={20} fill="white" /> : <Circle size={20} />}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm ${current ? 'font-semibold text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {STATUS_LABELS[status] ?? status}
                      </p>
                      {/* Show timestamp from history */}
                      {order.statusHistory && (() => {
                        const entry = order.statusHistory.find((h) => h.status === status);
                        return entry ? (
                          <p className="text-xs text-gray-400">{entry.changedAt.slice(0, 16).replace('T', ' ')}</p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              {lang === 'id' ? 'Daftar Layanan' : 'Services'}
            </h2>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.namaItem}</p>
                    <p className="text-xs text-gray-400">
                      {item.qty} {item.tipe === 'kiloan' ? 'kg' : 'pcs'} × {formatIDR(item.harga)}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">{formatIDR(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t pt-3">
              {order.diskonAmount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>{lang === 'id' ? `Diskon (${order.diskonPersen}%)` : `Discount (${order.diskonPersen}%)`}</span>
                  <span>- {formatIDR(order.diskonAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Total</span>
                <span>{formatIDR(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {order.catatan && (
          <div className="rounded-xl border bg-white px-5 py-3 text-sm text-gray-600 shadow-sm">
            <span className="font-medium">{lang === 'id' ? 'Catatan:' : 'Note:'}</span> {order.catatan}
          </div>
        )}
      </div>
    </main>
  );
}

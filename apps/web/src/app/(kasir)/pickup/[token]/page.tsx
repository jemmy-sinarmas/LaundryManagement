'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@laundry-palu/shared';
import { CheckCircle, XCircle, Clock, QrCode } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  diterima: 'Diterima',
  dicuci: 'Sedang Dicuci',
  dikeringkan: 'Sedang Dikeringkan',
  dibungkus: 'Sedang Dibungkus',
  siap_diambil: 'Siap Diambil',
  selesai: 'Selesai',
};

export default function PickupPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get<Order>(`/api/v1/orders/pickup/${token}`)
      .then(setOrder)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Token tidak valid atau kadaluarsa');
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleComplete() {
    if (!token) return;
    setCompleting(true);
    setError(null);
    try {
      const updated = await api.patch<Order>(`/api/v1/orders/pickup/${token}/complete`, {});
      setOrder(updated);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memvalidasi pengambilan';
      setError(msg);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-400">Memuat...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <XCircle size={48} className="text-red-400" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Token Tidak Valid</h2>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
        <button
          onClick={() => router.push('/antrian')}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Cari Pesanan Manual
        </button>
      </div>
    );
  }

  if (!order) return null;

  const isReady = order.status === 'siap_diambil';
  const isDone = order.status === 'selesai';

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-6 flex items-center gap-3">
        <QrCode size={24} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Validasi Pengambilan</h1>
      </div>

      {/* Order summary card */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">No. Invoice</span>
            <span className="font-medium">{order.invoiceNo}</span>
          </div>
          {order.customer && (
            <div className="flex justify-between">
              <span className="text-gray-500">Pelanggan</span>
              <span className="font-medium">{order.customer.nama}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">{formatIDR(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`font-medium ${isReady ? 'text-green-700' : isDone ? 'text-blue-700' : 'text-amber-700'}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Layanan</p>
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.namaItem} × {item.qty}</span>
                  <span className="text-gray-500">{formatIDR(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status message + action */}
      <div className="mt-6">
        {success || isDone ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle size={40} className="text-green-500" />
            <div>
              <p className="font-semibold text-green-800">Pengambilan Berhasil Divalidasi</p>
              <p className="mt-1 text-sm text-green-700">Pesanan telah diserahkan ke pelanggan.</p>
            </div>
            <button
              onClick={() => router.push('/antrian')}
              className="mt-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Kembali ke Pesanan
            </button>
          </div>
        ) : isReady ? (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <p className="text-center text-sm text-gray-600">
              Pesanan sudah siap. Tekan tombol di bawah untuk memvalidasi pengambilan.
            </p>
            <button
              onClick={() => void handleComplete()}
              disabled={completing}
              className="w-full rounded bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {completing ? 'Memvalidasi...' : 'Validasi Pengambilan'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
            <Clock size={36} className="text-amber-500" />
            <div>
              <p className="font-semibold text-amber-800">Pesanan Belum Siap</p>
              <p className="mt-1 text-sm text-amber-700">
                Status saat ini: <strong>{STATUS_LABELS[order.status] ?? order.status}</strong>. Pesanan harus
                dalam status &ldquo;Siap Diambil&rdquo; sebelum dapat divalidasi.
              </p>
            </div>
            <button
              onClick={() => router.push('/antrian')}
              className="mt-2 rounded border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
            >
              Lihat Daftar Pesanan
            </button>
          </div>
        )}
      </div>

      {/* Contingency note */}
      {!isDone && !success && (
        <p className="mt-4 text-center text-xs text-gray-400">
          Jika pelanggan kehilangan struk, cari pesanan melalui nomor HP atau invoice di halaman{' '}
          <button onClick={() => router.push('/antrian')} className="text-blue-500 underline">
            Daftar Pesanan
          </button>
          .
        </p>
      )}
    </div>
  );
}

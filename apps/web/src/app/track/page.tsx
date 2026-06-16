'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { useLangStore } from '@/store/langStore';
import type { Order } from '@laundry-palu/shared';
import { Search } from 'lucide-react';

export default function TrackLandingPage() {
  const { t } = useLangStore();
  const statusLabel = (status: string) =>
    (t.status as Record<string, string>)[status] ?? status;
  const [mode, setMode] = useState<'invoice' | 'phone'>('invoice');
  const [query, setQuery] = useState('');
  const [invoiceResult, setInvoiceResult] = useState<Order | null>(null);
  const [phoneResults, setPhoneResults] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setInvoiceResult(null);
    setPhoneResults(null);
    try {
      if (mode === 'invoice') {
        const order = await api.get<Order>(`/api/v1/track/${encodeURIComponent(query.trim())}`);
        setInvoiceResult(order);
      } else {
        const orders = await api.get<Order[]>(`/api/v1/track/phone/${encodeURIComponent(query.trim())}`);
        setPhoneResults(orders);
      }
    } catch {
      setError(
        mode === 'invoice'
          ? 'Pesanan tidak ditemukan. Periksa kembali nomor invoice Anda.'
          : 'Tidak ada pesanan ditemukan untuk nomor HP ini.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Laundry Palu</h1>
          <p className="mt-2 text-gray-500">Lacak status pesanan Anda</p>
        </div>

        {/* Search card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {/* Mode toggle */}
          <div className="mb-4 flex rounded-lg border p-1">
            {(['invoice', 'phone'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setQuery(''); setInvoiceResult(null); setPhoneResults(null); setError(null); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === m ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {m === 'invoice' ? 'No. Invoice' : 'No. HP'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type={mode === 'phone' ? 'tel' : 'text'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'invoice' ? 'INV-20260606-0001' : '081234567890'}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Search size={16} />
              {loading ? 'Mencari...' : 'Cari'}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Invoice result */}
        {invoiceResult && (
          <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400">Invoice</p>
                <p className="font-mono font-semibold text-gray-900">{invoiceResult.invoiceNo}</p>
                {invoiceResult.customer && (
                  <p className="text-sm text-gray-600">{invoiceResult.customer.nama}</p>
                )}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                invoiceResult.status === 'siap_diambil' ? 'bg-green-100 text-green-800' :
                invoiceResult.status === 'selesai' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {statusLabel(invoiceResult.status)}
              </span>
            </div>
            <p className="mb-3 text-lg font-bold text-gray-900">{formatIDR(invoiceResult.total)}</p>
            <Link
              href={`/track/${invoiceResult.invoiceNo}`}
              className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Lihat Detail →
            </Link>
          </div>
        )}

        {/* Phone results */}
        {phoneResults !== null && (
          <div className="mt-4 space-y-3">
            {phoneResults.length === 0 ? (
              <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
                Tidak ada pesanan ditemukan.
              </div>
            ) : (
              phoneResults.map((order) => (
                <Link
                  key={order.id}
                  href={`/track/${order.invoiceNo}`}
                  className="block rounded-xl border bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold text-gray-900">{order.invoiceNo}</p>
                      <p className="text-xs text-gray-400">{order.createdAt.slice(0, 10)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatIDR(order.total)}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === 'siap_diambil' ? 'bg-green-100 text-green-800' :
                        order.status === 'selesai' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

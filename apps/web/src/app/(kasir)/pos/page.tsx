'use client';
import { useState } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import PrintableInvoice from '@/components/invoice/PrintableInvoice';
import { formatIDR } from '@/lib/utils';
import { X, ShoppingCart, Wifi, WifiOff } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  satuan: 'Per Satuan',
  kiloan: 'Kiloan',
  jasa_lain: 'Jasa Lain',
};

export default function PosPage() {
  const {
    items,
    customerQuery, setCustomerQuery,
    customerResults,
    selectedCustomer, selectCustomer,
    discountPercent,
    cart, addToCart, updateQty, removeFromCart,
    subtotal, diskonAmount, total,
    createdOrder, clearCreatedOrder,
    submitting, submitOrder,
  } = usePOS();

  const { pendingCount } = useOfflineSync();
  const [catatan, setCatatan] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>('kiloan');

  async function handleSubmit() {
    setOrderError(null);
    try {
      await submitOrder(catatan || undefined);
      setCatatan('');
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  }

  const filteredItems = items.filter((i) => i.isActive && i.tipe === activeType);
  const types = Array.from(new Set(items.filter((i) => i.isActive).map((i) => i.tipe)));

  return (
    <div className="flex h-full gap-4">
      {/* Left panel: customer + items */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">

        {/* Offline indicator */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <WifiOff size={14} />
            {pendingCount} pesanan offline menunggu sinkronisasi
          </div>
        )}

        {/* Customer selector */}
        <div className="relative rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Pelanggan</p>
          {selectedCustomer ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{selectedCustomer.nama}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.noHp}</p>
                {discountPercent > 0 && (
                  <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Diskon {discountPercent}% aktif
                  </span>
                )}
              </div>
              <button
                onClick={() => { selectCustomer({ id: '', nama: '', noHp: '', alamat: null, createdAt: '', updatedAt: '' }); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Cari nama atau nomor HP..."
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {customerResults.length > 0 && (
                <div className="absolute left-4 right-4 top-full z-10 mt-1 rounded-lg border bg-white shadow-lg">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => void selectCustomer(c)}
                      className="flex w-full flex-col px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">{c.nama}</span>
                      <span className="text-xs text-gray-500">{c.noHp}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Item tabs + grid */}
        <div className="flex-1 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="flex border-b">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeType === t
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {TYPE_LABELS[t] ?? t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item, item.tipe === 'kiloan' ? 1 : 1)}
                className="flex flex-col rounded-lg border p-3 text-left hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="text-sm font-medium text-gray-900">{item.nama}</span>
                <span className="mt-1 text-sm text-blue-600">{formatIDR(item.harga)}</span>
                {item.tipe === 'kiloan' && (
                  <span className="text-xs text-gray-400">/ kg</span>
                )}
              </button>
            ))}
            {filteredItems.length === 0 && (
              <p className="col-span-3 py-8 text-center text-sm text-gray-400">
                Tidak ada layanan.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right panel: cart */}
      <div className="flex w-80 flex-col rounded-lg border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b p-4">
          <ShoppingCart size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Keranjang</h2>
          {cart.length > 0 && (
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {cart.length}
            </span>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Keranjang kosong</p>
          ) : (
            cart.map(({ item, qty }) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.nama}</p>
                  <p className="text-xs text-gray-500">{formatIDR(item.harga)}{item.tipe === 'kiloan' ? '/kg' : ''}</p>
                </div>
                <input
                  type="number"
                  value={qty}
                  min={0.1}
                  step={item.tipe === 'kiloan' ? 0.5 : 1}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (v > 0) updateQty(item.id, v);
                  }}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                />
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals + submit */}
        <div className="border-t p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            {diskonAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Diskon ({discountPercent}%)</span>
                <span>- {formatIDR(diskonAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span>{formatIDR(total)}</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="Catatan (opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          {orderError && (
            <p className="text-xs text-red-600">{orderError}</p>
          )}

          <button
            onClick={() => void handleSubmit()}
            disabled={submitting || !selectedCustomer || cart.length === 0}
            className="w-full rounded bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </div>
      </div>

      {/* Invoice modal */}
      {createdOrder && (
        <PrintableInvoice order={createdOrder} onClose={clearCreatedOrder} />
      )}
    </div>
  );
}

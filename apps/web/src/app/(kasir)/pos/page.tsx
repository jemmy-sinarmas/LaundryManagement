'use client';
import { useState } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import PrintableInvoice from '@/components/invoice/PrintableInvoice';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { COUNTRY_CODES } from '@laundry-palu/shared';
import type { Customer } from '@laundry-palu/shared';
import { X, ShoppingCart, WifiOff, UserPlus } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  satuan: 'Per Satuan',
  kiloan: 'Kiloan',
  jasa_lain: 'Jasa Lain',
};

type NewCustomerForm = { nama: string; countryCode: string; noHp: string; alamat: string };
const EMPTY_NEW_CUSTOMER: NewCustomerForm = { nama: '', countryCode: '+62', noHp: '', alamat: '' };

function NewCustomerModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: NewCustomerForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewCustomerForm>(EMPTY_NEW_CUSTOMER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambah pelanggan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tambah Pelanggan Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">No. HP</label>
            <div className="flex gap-2">
              <select
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                className="rounded border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.name}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={form.noHp}
                onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                required
                placeholder="08xxxxxxxxxx"
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Alamat <span className="text-gray-400">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Pilih'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PosPage() {
  const {
    items,
    activePromotions,
    customerQuery, setCustomerQuery,
    customerResults,
    selectedCustomer, selectCustomer,
    discountPercent,
    selectedPromo, setSelectedPromo,
    metodePembayaran, setMetodePembayaran,
    jumlahDibayar, setJumlahDibayar,
    cart, addToCart, updateQty, removeFromCart,
    subtotal, diskonAmount, promoDiskonAmount, total,
    createdOrder, clearCreatedOrder,
    submitting, submitOrder,
  } = usePOS();

  const { pendingCount } = useOfflineSync();
  const [catatan, setCatatan] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>('kiloan');
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  async function handleSubmit() {
    setOrderError(null);
    try {
      await submitOrder(catatan || undefined);
      setCatatan('');
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  }

  async function handleNewCustomer(form: NewCustomerForm) {
    const customer = await api.post<Customer>('/api/v1/customers', {
      nama: form.nama,
      noHp: form.noHp,
      alamat: form.alamat || null,
      countryCode: form.countryCode,
    });
    await selectCustomer(customer);
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
                onClick={() => { void selectCustomer({ id: '', nama: '', noHp: '', alamat: null, countryCode: '+62', createdAt: '', updatedAt: '' }); }}
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
              <button
                onClick={() => setShowNewCustomer(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <UserPlus size={12} />
                + Pelanggan Baru
              </button>
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
        <div className="flex-1 overflow-y-auto space-y-3 p-4">
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
        <div className="space-y-3 border-t p-4">
          {/* Promo selection */}
          {selectedCustomer && activePromotions.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">Pilih Promosi</p>
              <div className="space-y-1.5">
                {activePromotions.map((promo) => (
                  <button
                    key={promo.id}
                    onClick={() => setSelectedPromo(selectedPromo?.id === promo.id ? null : promo)}
                    className={`w-full rounded border px-3 py-2 text-left text-xs transition-colors ${
                      selectedPromo?.id === promo.id
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{promo.nama}</span>
                    <span className="ml-1 text-gray-500">
                      {promo.tipe === 'persen' ? `${promo.nilai}%` : `- ${formatIDR(promo.nilai)}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            {diskonAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Diskon Member ({discountPercent}%)</span>
                <span>- {formatIDR(diskonAmount)}</span>
              </div>
            )}
            {promoDiskonAmount > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>Promo {selectedPromo?.nama}</span>
                <span>- {formatIDR(promoDiskonAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span>{formatIDR(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
              Metode Pembayaran
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([['tunai', 'Tunai'], ['qris', 'QRIS'], ['transfer_bca', 'TRF BCA']] as const).map(
                ([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetodePembayaran(m)}
                    className={`rounded border px-2 py-2 text-xs font-medium transition-colors ${
                      metodePembayaran === m
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Amount paid (leave blank for full payment) */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Jumlah Dibayar
            </label>
            <input
              type="number"
              min={0}
              placeholder={`Penuh (${formatIDR(total)})`}
              value={jumlahDibayar ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setJumlahDibayar(v === '' ? null : Math.max(0, Math.floor(Number(v))));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {jumlahDibayar !== null && jumlahDibayar < total && (
              <p className="mt-1 text-xs text-amber-600">Piutang: {formatIDR(total - jumlahDibayar)}</p>
            )}
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
            className="w-full rounded bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </div>
      </div>

      {/* Invoice modal */}
      {createdOrder && (
        <PrintableInvoice order={createdOrder} onClose={clearCreatedOrder} />
      )}

      {/* New customer modal */}
      {showNewCustomer && (
        <NewCustomerModal
          onSubmit={handleNewCustomer}
          onClose={() => setShowNewCustomer(false)}
        />
      )}
    </div>
  );
}

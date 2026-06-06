'use client';
import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import StockAlert from '@/components/inventory/StockAlert';
import TransactionHistory from '@/components/inventory/TransactionHistory';
import { formatIDR } from '@/lib/utils';
import type { InventoryItem, InventoryTransaction } from '@laundry-palu/shared';
import { X } from 'lucide-react';

// ---- Purchase Modal ----
type PurchaseForm = { qty: string; hargaPerUnit: string; referensi: string };
const EMPTY_PURCHASE: PurchaseForm = { qty: '', hargaPerUnit: '', referensi: '' };

function PurchaseModal({
  item,
  onSubmit,
  onClose,
}: {
  item: InventoryItem;
  onSubmit: (data: { qty: number; hargaPerUnit: number; referensi?: string | null }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PurchaseForm>(EMPTY_PURCHASE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        qty: parseFloat(form.qty),
        hargaPerUnit: parseInt(form.hargaPerUnit, 10),
        referensi: form.referensi || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat pembelian');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Catat Masuk — {item.nama}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Qty ({item.satuan})
              </label>
              <input
                type="number"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                required min={0.01} step={0.01}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Harga / {item.satuan}</label>
              <input
                type="number"
                value={form.hargaPerUnit}
                onChange={(e) => setForm({ ...form, hargaPerUnit: e.target.value })}
                required min={1}
                placeholder="IDR"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Referensi <span className="text-gray-400">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.referensi}
              onChange={(e) => setForm({ ...form, referensi: e.target.value })}
              placeholder="No. PO, nama supplier..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {form.qty && form.hargaPerUnit && (
            <p className="text-xs text-gray-500">
              Stok baru: {item.qtySaatIni + parseFloat(form.qty || '0')} {item.satuan}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Catat Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- History Modal ----
function HistoryModal({
  item,
  transactions,
  histLoading,
  onClose,
}: {
  item: InventoryItem;
  transactions: InventoryTransaction[];
  histLoading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat — {item.nama}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <TransactionHistory transactions={transactions} satuan={item.satuan} loading={histLoading} />
      </div>
    </div>
  );
}

// ---- Create Item Modal ----
type CreateForm = { nama: string; satuan: string; stokMinimum: string };
const EMPTY_CREATE: CreateForm = { nama: '', satuan: '', stokMinimum: '0' };

function CreateItemModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: { nama: string; satuan: string; stokMinimum: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ nama: form.nama, satuan: form.satuan, stokMinimum: parseFloat(form.stokMinimum) });
      onClose();
    } catch {
      setError('Gagal menambah item. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tambah Item Inventori</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama</label>
            <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Satuan</label>
              <input type="text" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                required placeholder="kg, liter, pcs..." className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stok Minimum</label>
              <input type="number" value={form.stokMinimum} onChange={(e) => setForm({ ...form, stokMinimum: e.target.value })}
                required min={0} step={0.01} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function InventoryPage() {
  const { items, lowStock, loading, error, createItem, recordPurchase, getTransactions } = useInventory();

  const [purchaseItem, setPurchaseItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [histTransactions, setHistTransactions] = useState<InventoryTransaction[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  async function openHistory(item: InventoryItem) {
    setHistoryItem(item);
    setHistLoading(true);
    setHistTransactions([]);
    try {
      const txs = await getTransactions(item.id);
      setHistTransactions(txs);
    } catch {
      // empty list shown
    } finally {
      setHistLoading(false);
    }
  }

  const totalValue = items.reduce((s, i) => s + i.qtySaatIni * i.hargaRataFifo, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventori</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500">
              Nilai stok: <span className="font-medium text-gray-900">{formatIDR(totalValue)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Item
        </button>
      </div>

      <StockAlert items={lowStock} />

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Nama', 'Satuan', 'Stok Saat Ini', 'Stok Min', 'Harga Rata FIFO', 'Nilai Stok', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Memuat...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Belum ada item inventori.</td></tr>
            ) : (
              items.map((item) => {
                const isLow = item.qtySaatIni <= item.stokMinimum;
                const stockValue = item.qtySaatIni * item.hargaRataFifo;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nama}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.satuan}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.qtySaatIni}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.stokMinimum}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatIDR(item.hargaRataFifo)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatIDR(stockValue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPurchaseItem(item)}
                          className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          + Masuk
                        </button>
                        <button
                          onClick={() => void openHistory(item)}
                          className="rounded border px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Riwayat
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {purchaseItem && (
        <PurchaseModal
          item={purchaseItem}
          onSubmit={async (data) => { await recordPurchase(purchaseItem.id, data); }}
          onClose={() => setPurchaseItem(null)}
        />
      )}

      {historyItem && (
        <HistoryModal
          item={historyItem}
          transactions={histTransactions}
          histLoading={histLoading}
          onClose={() => { setHistoryItem(null); setHistTransactions([]); }}
        />
      )}

      {showCreate && (
        <CreateItemModal
          onSubmit={async (data) => { await createItem(data); }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

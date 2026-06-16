'use client';
import { useState } from 'react';
import { toast } from '@/store/toastStore';
import type { ExpenseCategory, ExpensePaymentMethod, InventoryItem } from '@laundry-palu/shared';

type Props = {
  categories: ExpenseCategory[];
  inventoryItems: InventoryItem[];
  onSubmit: (data: {
    tanggal: string;
    jumlah: number;
    categoryId: string;
    deskripsi?: string | null;
    inventoryItemId?: string | null;
    qtyUsed?: number | null;
    metodePembayaran?: ExpensePaymentMethod;
  }) => Promise<void>;
  onCancel?: () => void;
};

export default function ExpenseForm({ categories, inventoryItems, onSubmit, onCancel }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal] = useState(today);
  const [jumlah, setJumlah] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [qtyUsed, setQtyUsed] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState<ExpensePaymentMethod>('tunai');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedInvItem = inventoryItems.find((i) => i.id === inventoryItemId) ?? null;
  const previewStock =
    selectedInvItem && qtyUsed
      ? selectedInvItem.qtySaatIni - parseFloat(qtyUsed)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        tanggal,
        jumlah: parseInt(jumlah, 10),
        categoryId,
        deskripsi: deskripsi || null,
        inventoryItemId: inventoryItemId || null,
        qtyUsed: inventoryItemId && qtyUsed ? parseFloat(qtyUsed) : null,
        metodePembayaran,
      });
      // Reset form
      setJumlah('');
      setCategoryId('');
      setDeskripsi('');
      setInventoryItemId('');
      setQtyUsed('');
      setMetodePembayaran('tunai');
      setTanggal(today);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengeluaran';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah (IDR)</label>
          <input
            type="number"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            required
            min={1}
            placeholder="0"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- Pilih kategori --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama} ({c.level})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Metode Pembayaran</label>
        <div className="grid grid-cols-2 gap-2">
          {([['tunai', 'Tunai'], ['transfer', 'Transfer']] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetodePembayaran(m)}
              className={`rounded border px-3 py-2 text-sm font-medium transition-colors ${
                metodePembayaran === m
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
        <input
          type="text"
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Opsional"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Inventory link */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Item Inventori <span className="text-gray-400">(opsional)</span>
        </label>
        <select
          value={inventoryItemId}
          onChange={(e) => { setInventoryItemId(e.target.value); setQtyUsed(''); }}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- Tidak terhubung --</option>
          {inventoryItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nama} (stok: {i.qtySaatIni} {i.satuan})
            </option>
          ))}
        </select>
      </div>

      {inventoryItemId && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Qty Digunakan ({selectedInvItem?.satuan ?? 'unit'})
          </label>
          <input
            type="number"
            value={qtyUsed}
            onChange={(e) => setQtyUsed(e.target.value)}
            required
            min={0.01}
            step={0.01}
            placeholder="0"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {/* Stock preview */}
          {selectedInvItem && qtyUsed && (
            <p className={`mt-1 text-xs ${previewStock !== null && previewStock < 0 ? 'text-red-600' : 'text-gray-500'}`}>
              Stok: {selectedInvItem.qtySaatIni} → {previewStock?.toFixed(2)} {selectedInvItem.satuan}
              {previewStock !== null && previewStock < 0 && ' ⚠ Stok tidak cukup'}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
        </button>
      </div>
    </form>
  );
}

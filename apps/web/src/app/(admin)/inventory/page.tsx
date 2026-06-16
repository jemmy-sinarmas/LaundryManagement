'use client';
import { useRef, useState, useEffect } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useLangStore } from '@/store/langStore';
import { toast } from '@/store/toastStore';
import StockAlert from '@/components/inventory/StockAlert';
import TransactionHistory from '@/components/inventory/TransactionHistory';
import FieldHint from '@/components/ui/FieldHint';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { formatIDR } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Branch, InventoryItem, InventoryTransaction } from '@laundry-palu/shared';
import { X, Plus, Trash2 } from 'lucide-react';

// ---- Purchase Modal (single item) ----
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
  const { t } = useLangStore();
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
      setError(err instanceof Error ? err.message : t.inventory.error_purchase);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.inventory.purchase_title} — {item.nama}</h2>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.inventory.price_per_unit} / {item.satuan}</label>
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
              {t.inventory.reference} <span className="text-gray-400">{t.common.optional}</span>
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
              {t.inventory.stock_current}: {item.qtySaatIni + parseFloat(form.qty || '0')} {item.satuan}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {t.common.cancel}
            </button>
            <button type="submit" disabled={loading}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {loading ? t.common.saving : t.inventory.purchase_title}
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
  const { t } = useLangStore();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.inventory.history_title} — {item.nama}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <TransactionHistory transactions={transactions} satuan={item.satuan} loading={histLoading} />
      </div>
    </div>
  );
}

// ---- Create Item Modal ----
type CreateForm = { nama: string; satuan: string; stokMinimum: string; branchId: string };
const EMPTY_CREATE: CreateForm = { nama: '', satuan: '', stokMinimum: '0', branchId: '' };

function CreateItemModal({
  branches,
  onSubmit,
  onClose,
}: {
  branches: Branch[];
  onSubmit: (data: { nama: string; satuan: string; stokMinimum: number; branchId: string }) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLangStore();
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.branchId) { setError(t.inventory.branch_required); return; }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ nama: form.nama, satuan: form.satuan, stokMinimum: parseFloat(form.stokMinimum), branchId: form.branchId });
      onClose();
    } catch {
      setError(t.inventory.error_add);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.inventory.new}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.nav.branches}</label>
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">{t.inventory.select_branch}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.nama} ({b.kode})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.inventory.name}</label>
            <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.inventory.unit}</label>
              <input type="text" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                required placeholder="kg, liter, pcs..." className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.inventory.stock_min}
                <FieldHint text={t.inventory.min_stock_form_hint} />
              </label>
              <input type="number" value={form.stokMinimum} onChange={(e) => setForm({ ...form, stokMinimum: e.target.value })}
                required min={0} step={0.01} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t.common.cancel}</button>
            <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Bulk Purchase Modal ----
type BulkRow = { itemId: string; qty: string; hargaPerUnit: string; referensi: string };
const EMPTY_ROW: BulkRow = { itemId: '', qty: '', hargaPerUnit: '', referensi: '' };

function BulkPurchaseModal({
  items,
  onSubmit,
  onClose,
}: {
  items: InventoryItem[];
  onSubmit: (data: {
    items: Array<{ itemId: string; qty: number; hargaPerUnit: number; referensi?: string | null }>;
    fotoReferensi?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLangStore();
  const [rows, setRows] = useState<BulkRow[]>([{ ...EMPTY_ROW }]);
  const [fotoBase64, setFotoBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof BulkRow, value: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFotoBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validRows = rows.filter((r) => r.itemId && r.qty && r.hargaPerUnit);
    if (validRows.length === 0) {
      setError(t.inventory.bulk_min_error);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        items: validRows.map((r) => ({
          itemId: r.itemId,
          qty: parseFloat(r.qty),
          hargaPerUnit: parseInt(r.hargaPerUnit, 10),
          referensi: r.referensi || null,
        })),
        fotoReferensi: fotoBase64 || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.inventory.error_bulk);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.inventory.bulk_purchase}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-2">Item</th>
                  <th className="pb-2 pr-2">Qty</th>
                  <th className="pb-2 pr-2">{t.inventory.price_per_unit}</th>
                  <th className="pb-2 pr-2">{t.inventory.reference}</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <select
                        value={row.itemId}
                        onChange={(e) => updateRow(idx, 'itemId', e.target.value)}
                        required={idx === 0}
                        className="w-44 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Pilih item...</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nama} ({item.satuan})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) => updateRow(idx, 'qty', e.target.value)}
                        min={0.01} step={0.01}
                        placeholder="0"
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={row.hargaPerUnit}
                        onChange={(e) => updateRow(idx, 'hargaPerUnit', e.target.value)}
                        min={1}
                        placeholder="IDR"
                        className="w-28 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={row.referensi}
                        onChange={(e) => updateRow(idx, 'referensi', e.target.value)}
                        placeholder="No. PO..."
                        className="w-32 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <Plus size={14} />
            {t.inventory.add_row}
          </button>

          <div className="rounded-lg border border-dashed border-gray-300 p-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              {t.inventory.foto_ref} <span className="text-gray-400">{t.common.optional}</span>
            </p>
            {fotoBase64 ? (
              <div className="flex items-center gap-3">
                <img src={fotoBase64} alt="Foto referensi" className="h-16 rounded border object-contain" />
                <button
                  type="button"
                  onClick={() => { setFotoBase64(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-xs text-red-500 hover:underline"
                >
                  {t.inventory.foto_delete}
                </button>
              </div>
            ) : (
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFotoChange}
                className="block text-sm text-gray-500 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-white file:px-3 file:py-1 file:text-sm hover:file:bg-gray-50"
              />
            )}
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
              disabled={loading}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? t.common.saving : `${t.inventory.purchase_title} ${rows.filter((r) => r.itemId).length} Item`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function InventoryPage() {
  const { t } = useLangStore();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const { items, lowStock, loading, error, createItem, recordPurchase, bulkPurchase, getTransactions } = useInventory({ branchId: selectedBranch || null });

  const [purchaseItem, setPurchaseItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [histTransactions, setHistTransactions] = useState<InventoryTransaction[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    api.get<Branch[]>('/api/v1/branches').then(setBranches).catch(() => setBranches([]));
  }, []);

  async function openHistory(item: InventoryItem) {
    setHistoryItem(item);
    setHistLoading(true);
    setHistTransactions([]);
    try {
      const txs = await getTransactions(item.id);
      setHistTransactions(txs);
    } catch {
      toast.error(t.common.error);
    } finally {
      setHistLoading(false);
    }
  }

  const totalValue = items.reduce((s, i) => s + i.qtySaatIni * i.hargaRataFifo, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.inventory.title}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500">
              {t.inventory.stock_value_label} <span className="font-medium text-gray-900">{formatIDR(totalValue)}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">{t.common.all_branches}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.nama} ({b.kode})</option>
            ))}
          </select>
          <button
            onClick={() => setShowBulk(true)}
            className="rounded border border-green-600 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            {t.inventory.bulk_purchase}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.inventory.new}
          </button>
        </div>
      </div>

      <StockAlert items={lowStock} />

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[t.inventory.name, t.inventory.unit, t.inventory.stock_current].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                {t.inventory.stock_min}
                <FieldHint text={t.inventory.stock_min_hint} />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                {t.inventory.avg_cost}
                <FieldHint text={t.inventory.avg_cost_hint} />
              </th>
              {[t.inventory.stock_value, t.common.actions].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton cols={7} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  {t.inventory.empty}{' '}
                  <button onClick={() => setShowCreate(true)} className="text-blue-600 hover:underline">
                    {t.inventory.cta_add}
                  </button>
                </td>
              </tr>
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
                          {t.inventory.in_btn}
                        </button>
                        <button
                          onClick={() => void openHistory(item)}
                          className="rounded border px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          {t.inventory.history}
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
          branches={branches}
          onSubmit={async (data) => { await createItem(data); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {showBulk && (
        <BulkPurchaseModal
          items={items}
          onSubmit={async (data) => { await bulkPurchase(data); }}
          onClose={() => setShowBulk(false)}
        />
      )}
    </div>
  );
}

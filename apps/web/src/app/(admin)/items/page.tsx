'use client';
import { useState } from 'react';
import { useItems } from '@/hooks/useItems';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatIDR } from '@/lib/utils';
import { toast } from '@/store/toastStore';
import { ITEM_TYPES } from '@laundry-palu/shared';
import type { Item } from '@laundry-palu/shared';

const TYPE_LABELS: Record<string, string> = {
  satuan: 'Per Satuan',
  kiloan: 'Kiloan',
  jasa_lain: 'Jasa Lain',
};

type CreateForm = { nama: string; tipe: string; harga: string };
const EMPTY_FORM: CreateForm = { nama: '', tipe: 'satuan', harga: '' };

export default function ItemsPage() {
  const { items, loading, error, createItem, deactivateItem, activateItem } = useItems(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Item | null>(null);

  const displayed = showInactive ? items : items.filter((i) => i.isActive);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createItem({ nama: form.nama, tipe: form.tipe, harga: parseInt(form.harga, 10) });
      setShowDialog(false);
      setForm(EMPTY_FORM);
      toast.success('Layanan berhasil ditambahkan');
    } catch {
      setFormError('Gagal menambah layanan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(item: Item) {
    setActionId(item.id);
    setConfirmTarget(null);
    try {
      if (item.isActive) {
        await deactivateItem(item.id);
        toast.info(`${item.nama} dinonaktifkan`);
      } else {
        await activateItem(item.id);
        toast.success(`${item.nama} diaktifkan kembali`);
      }
    } catch {
      toast.error('Gagal mengubah status layanan');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Layanan</h1>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Tampilkan nonaktif
          </label>
          <button
            onClick={() => setShowDialog(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tambah Layanan
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Nama', 'Tipe', 'Harga', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Memuat...</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Belum ada layanan.</td></tr>
            ) : (
              displayed.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${!item.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{TYPE_LABELS[item.tipe] ?? item.tipe}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatIDR(item.harga)}
                    {item.tipe === 'kiloan' && <span className="text-gray-400"> /kg</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => item.isActive ? setConfirmTarget(item) : void handleToggle(item)}
                      disabled={actionId === item.id}
                      className={`text-sm hover:underline disabled:opacity-50 ${item.isActive ? 'text-red-600' : 'text-blue-600'}`}
                    >
                      {actionId === item.id ? '...' : item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm deactivate */}
      <ConfirmDialog
        open={!!confirmTarget}
        title="Nonaktifkan Layanan?"
        message={`"${confirmTarget?.nama}" tidak akan muncul di POS setelah dinonaktifkan.`}
        confirmLabel="Nonaktifkan"
        danger
        onConfirm={() => confirmTarget && void handleToggle(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Create dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tambah Layanan</h2>
            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama Layanan</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tipe</label>
                <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                  {ITEM_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Harga (IDR){form.tipe === 'kiloan' ? ' /kg' : ''}
                </label>
                <input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required min={1}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowDialog(false); setForm(EMPTY_FORM); setFormError(null); }}
                  className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={submitting}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

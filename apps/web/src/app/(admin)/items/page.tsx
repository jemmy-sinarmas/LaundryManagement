'use client';
import { useState, useEffect } from 'react';
import { useItems } from '@/hooks/useItems';
import { useLangStore } from '@/store/langStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { formatIDR } from '@/lib/utils';
import { toast } from '@/store/toastStore';
import { api } from '@/lib/api';
import { ITEM_TYPES } from '@laundry-palu/shared';
import type { Branch, Item } from '@laundry-palu/shared';

type CreateForm = { nama: string; tipe: string; harga: string; branchId: string };
const EMPTY_FORM: CreateForm = { nama: '', tipe: 'satuan', harga: '', branchId: '' };

export default function ItemsPage() {
  const { t } = useLangStore();
  const [selectedBranch, setSelectedBranch] = useState('');
  const { items, loading, error, createItem, deactivateItem, activateItem } = useItems({ includeInactive: true, branchId: selectedBranch || null });
  const [showInactive, setShowInactive] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Item | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const TYPE_LABELS: Record<string, string> = {
    satuan: t.items.type_per_satuan,
    kiloan: t.items.type_kiloan,
    jasa_lain: t.items.type_jasa_lain,
  };

  useEffect(() => {
    api.get<Branch[]>('/api/v1/branches').then(setBranches).catch(() => setBranches([]));
  }, []);

  const displayed = showInactive ? items : items.filter((i) => i.isActive);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createItem({ nama: form.nama, tipe: form.tipe, harga: parseInt(form.harga, 10), branchId: form.branchId });
      setShowDialog(false);
      setForm(EMPTY_FORM);
      toast.success(t.items.save_success);
    } catch {
      setFormError(t.items.error_create);
      toast.error(t.items.error_create);
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
        toast.info(`${item.nama} ${t.items.deactivate.toLowerCase()}`);
      } else {
        await activateItem(item.id);
        toast.success(`${item.nama} ${t.items.reactivate.toLowerCase()}`);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t.items.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">{t.common.all_branches}</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.nama} ({b.kode})</option>)}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            {t.items.show_inactive}
          </label>
          <button
            onClick={() => setShowDialog(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.items.new}
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
              {[t.items.name, t.items.type, t.items.price, t.common.status, t.common.actions].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton cols={5} />
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                  {showInactive
                    ? t.items.empty_inactive
                    : (
                      <span>
                        {t.items.empty}{' '}
                        <button onClick={() => setShowDialog(true)} className="text-blue-600 hover:underline">
                          {t.items.cta_add}
                        </button>
                      </span>
                    )
                  }
                </td>
              </tr>
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
                      {item.isActive ? t.common.active : t.common.inactive}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => item.isActive ? setConfirmTarget(item) : void handleToggle(item)}
                      disabled={actionId === item.id}
                      className={`text-sm hover:underline disabled:opacity-50 ${item.isActive ? 'text-red-600' : 'text-blue-600'}`}
                    >
                      {actionId === item.id ? '...' : item.isActive ? t.items.deactivate : t.items.reactivate}
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
        title={t.items.confirm_deactivate}
        message={`"${confirmTarget?.nama}" ${t.items.confirm_deactivate_msg}`}
        confirmLabel={t.items.deactivate}
        danger
        onConfirm={() => confirmTarget && void handleToggle(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Create dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t.items.new}</h2>
            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t.nav.branches} <span className="text-red-500">*</span></label>
                <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="">{t.items.select_branch}</option>
                  {branches.filter((b) => b.isActive).map((b) => (
                    <option key={b.id} value={b.id}>{b.nama} ({b.kode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t.items.name_label}</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t.items.type}</label>
                <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                  {ITEM_TYPES.map((tp) => <option key={tp} value={tp}>{TYPE_LABELS[tp] ?? tp}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.items.price_label}{form.tipe === 'kiloan' ? ' /kg' : ''}
                </label>
                <input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required min={1}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowDialog(false); setForm(EMPTY_FORM); setFormError(null); }}
                  className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t.common.cancel}</button>
                <button type="submit" disabled={submitting}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

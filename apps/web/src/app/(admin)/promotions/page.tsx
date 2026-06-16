'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/store/toastStore';
import { useLangStore } from '@/store/langStore';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { formatIDR } from '@/lib/utils';
import type { Promotion, Branch } from '@laundry-palu/shared';
import { X } from 'lucide-react';

type CreateForm = {
  nama: string;
  tipe: 'persen' | 'nominal';
  nilai: number;
  minOrder: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  branchId: string;
};

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const EMPTY_FORM: CreateForm = {
  nama: '',
  tipe: 'persen',
  nilai: 10,
  minOrder: 0,
  tanggalMulai: today,
  tanggalSelesai: nextMonth,
  branchId: '',
};

function CreatePromotionModal({
  branches,
  onSubmit,
  onClose,
}: {
  branches: Branch[];
  onSubmit: (data: CreateForm) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLangStore();
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
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
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.promotions.new}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.promotions.name}</label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required
              placeholder="Promo Lebaran 20%"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.promotions.type}</label>
              <select
                value={form.tipe}
                onChange={(e) => setForm({ ...form, tipe: e.target.value as 'persen' | 'nominal' })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="persen">{t.promotions.type_persen}</option>
                <option value="nominal">{t.promotions.type_nominal}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.promotions.value} {form.tipe === 'persen' ? '(%)' : '(Rp)'}
              </label>
              <input
                type="number"
                value={form.nilai}
                onChange={(e) => setForm({ ...form, nilai: Number(e.target.value) })}
                min={1}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.promotions.min_order}</label>
            <input
              type="number"
              value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
              min={0}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">{t.promotions.min_order_hint}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.promotions.period_start}</label>
              <input
                type="date"
                value={form.tanggalMulai}
                onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.promotions.period_end}</label>
              <input
                type="date"
                value={form.tanggalSelesai}
                onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t.promotions.branch_col} <span className="text-gray-400">({t.promotions.branch_hint})</span>
            </label>
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">{t.common.all_branches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {t.common.cancel}
            </button>
            <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const { t } = useLangStore();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Promotion[]>('/api/v1/promotions');
      setPromotions(data);
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchPromotions();
    api.get<Branch[]>('/api/v1/branches').then(setBranches).catch(() => undefined);
  }, [fetchPromotions]);

  async function handleCreate(form: CreateForm) {
    await api.post('/api/v1/promotions', {
      nama: form.nama,
      tipe: form.tipe,
      nilai: form.nilai,
      minOrder: form.minOrder || 0,
      tanggalMulai: form.tanggalMulai,
      tanggalSelesai: form.tanggalSelesai,
      branchId: form.branchId || undefined,
    });
    toast.success('Promosi berhasil ditambahkan');
    await fetchPromotions();
  }

  async function toggleActive(promo: Promotion) {
    setToggling(promo.id);
    try {
      await api.patch(`/api/v1/promotions/${promo.id}`, { isActive: !promo.isActive });
      setPromotions((prev) => prev.map((p) => p.id === promo.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(promo.isActive ? 'Promosi dinonaktifkan' : 'Promosi diaktifkan');
    } catch {
      toast.error(t.common.error);
    } finally {
      setToggling(null);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.promotions.title}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t.promotions.new}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[t.common.name, t.promotions.type, t.promotions.value, t.promotions.min_order_col, t.promotions.branch_col, t.promotions.period_col, t.common.status, t.common.actions].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton cols={8} />
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  {t.promotions.empty}{' '}
                  <button onClick={() => setShowCreate(true)} className="text-blue-600 hover:underline">
                    {t.promotions.cta_add}
                  </button>
                </td>
              </tr>
            ) : (
              promotions.map((promo) => {
                const branch = branches.find((b) => b.id === promo.branchId);
                const expired = promo.tanggalSelesai < todayStr;
                const notStarted = promo.tanggalMulai > todayStr;
                return (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{promo.nama}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {promo.tipe === 'persen' ? t.promotions.type_persen : t.promotions.type_nominal}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {promo.tipe === 'persen' ? `${promo.nilai}%` : formatIDR(promo.nilai)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {promo.minOrder > 0 ? formatIDR(promo.minOrder) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{branch?.nama ?? t.common.all_branches}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <span className={expired ? 'text-red-500' : notStarted ? 'text-yellow-600' : 'text-green-600'}>
                        {promo.tanggalMulai} s/d {promo.tanggalSelesai}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        promo.isActive && !expired ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {promo.isActive && !expired
                          ? t.promotions.status_active
                          : expired
                          ? t.promotions.status_expired
                          : t.promotions.status_inactive}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void toggleActive(promo)}
                        disabled={toggling === promo.id}
                        className={`rounded border px-3 py-1 text-xs disabled:opacity-50 ${
                          promo.isActive
                            ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                            : 'border-green-300 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {toggling === promo.id ? '...' : promo.isActive ? t.promotions.deactivate : t.promotions.activate}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreatePromotionModal
          branches={branches}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { EXPENSE_LEVELS } from '@laundry-palu/shared';

const LEVEL_LABELS: Record<string, string> = { variabel: 'Variabel', tetap: 'Tetap' };
const LEVEL_COLORS: Record<string, string> = {
  variabel: 'bg-orange-100 text-orange-700',
  tetap:    'bg-blue-100 text-blue-700',
};

type CreateForm = { nama: string; level: string };
const EMPTY_FORM: CreateForm = { nama: '', level: 'variabel' };

export default function ExpenseCategoriesPage() {
  const { categories, loading, createCategory } = useExpenses();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createCategory(form);
      setShowDialog(false);
      setForm(EMPTY_FORM);
    } catch {
      setFormError('Gagal membuat kategori. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kategori Pengeluaran</h1>
        <button
          onClick={() => setShowDialog(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Kategori
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Nama Kategori', 'Level'].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-400">Memuat...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-400">Belum ada kategori.</td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.nama}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        LEVEL_COLORS[c.level] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {LEVEL_LABELS[c.level] ?? c.level}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tambah Kategori</h2>
            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama Kategori</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {EXPENSE_LEVELS.map((l) => (
                    <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDialog(false); setForm(EMPTY_FORM); setFormError(null); }}
                  className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
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

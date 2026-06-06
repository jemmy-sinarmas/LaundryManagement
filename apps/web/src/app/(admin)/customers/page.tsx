'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCustomers } from '@/hooks/useCustomers';

type CreateForm = { nama: string; noHp: string; alamat: string };
const EMPTY_FORM: CreateForm = { nama: '', noHp: '', alamat: '' };

export default function CustomersPage() {
  const { customers, loading, error, query, setQuery, createCustomer } = useCustomers();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createCustomer({
        nama: form.nama,
        noHp: form.noHp,
        alamat: form.alamat || undefined,
      });
      setShowDialog(false);
      setForm(EMPTY_FORM);
    } catch {
      setFormError('Gagal menambah pelanggan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pelanggan</h1>
        <button
          onClick={() => setShowDialog(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tambah Pelanggan
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama atau nomor HP..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
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
              {['Nama', 'No. HP', 'Alamat', ''].map((h, i) => (
                <th
                  key={i}
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
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                  Memuat...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                  {query ? 'Tidak ada hasil untuk pencarian ini.' : 'Belum ada pelanggan.'}
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.noHp}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.alamat ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Customer Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tambah Pelanggan</h2>

            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
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
                <input
                  type="tel"
                  value={form.noHp}
                  onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                  required
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
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

'use client';
import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from '@/store/toastStore';
import type { User } from '@laundry-palu/shared';

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', kasir: 'Kasir' };

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
      {isActive ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

type CreateForm = { nama: string; username: string; password: string; role: string };
const EMPTY_FORM: CreateForm = { nama: '', username: '', password: '', role: 'kasir' };

export default function UsersPage() {
  const { users, loading, error, createUser, toggleActive } = useUsers();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createUser(form);
      setShowDialog(false);
      setForm(EMPTY_FORM);
      toast.success('Pengguna berhasil dibuat');
    } catch {
      setFormError('Gagal membuat pengguna. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(user: User) {
    setConfirmTarget(null);
    try {
      await toggleActive(user.id, !user.isActive);
      toast.info(`${user.nama} ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
    } catch {
      toast.error('Gagal mengubah status pengguna');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pengguna</h1>
        <button onClick={() => setShowDialog(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Tambah Pengguna
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Nama', 'Username', 'Role', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Memuat...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Belum ada pengguna.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.username}</td>
                  <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-6 py-4"><StatusBadge isActive={user.isActive} /></td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setConfirmTarget(user)}
                      className={`text-sm hover:underline ${user.isActive ? 'text-red-600' : 'text-blue-600'}`}
                    >
                      {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm toggle */}
      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.isActive ? 'Nonaktifkan Pengguna?' : 'Aktifkan Pengguna?'}
        message={
          confirmTarget?.isActive
            ? `${confirmTarget.nama} tidak dapat masuk sampai diaktifkan kembali.`
            : `${confirmTarget?.nama} dapat masuk kembali ke sistem.`
        }
        confirmLabel={confirmTarget?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        danger={confirmTarget?.isActive}
        onConfirm={() => confirmTarget && void handleToggle(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Create User Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tambah Pengguna</h2>
            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
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

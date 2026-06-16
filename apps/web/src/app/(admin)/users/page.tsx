'use client';
import { useState, useEffect } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useLangStore } from '@/store/langStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { toast } from '@/store/toastStore';
import { api } from '@/lib/api';
import type { Branch, User } from '@laundry-palu/shared';

function RoleBadge({ role }: { role: string }) {
  const { t } = useLangStore();
  const ROLE_LABELS: Record<string, string> = { admin: t.users.role_admin, kasir: t.users.role_kasir };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useLangStore();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
      {isActive ? t.common.active : t.common.inactive}
    </span>
  );
}

type CreateForm = { nama: string; username: string; password: string; role: string; branchId: string };
const EMPTY_FORM: CreateForm = { nama: '', username: '', password: '', role: 'kasir', branchId: '' };

export default function UsersPage() {
  const { users, loading, error, createUser, toggleActive } = useUsers();
  const { t } = useLangStore();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    api.get<Branch[]>('/api/v1/branches').then(setBranches).catch(() => setBranches([]));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createUser({ ...form, branchId: form.role === 'kasir' ? form.branchId : null });
      setShowDialog(false);
      setForm(EMPTY_FORM);
      toast.success('Pengguna berhasil dibuat');
    } catch {
      setFormError(t.common.error);
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
      toast.error(t.common.error);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.users.title}</h1>
        <button onClick={() => setShowDialog(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {t.users.new}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[t.users.name, t.users.username, t.users.role, t.common.status, t.common.actions].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton cols={5} />
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">{t.users.empty}</td></tr>
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
                      {user.isActive ? t.users.deactivate : t.users.reactivate}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.isActive ? t.users.confirm_deactivate : t.users.confirm_reactivate}
        message={
          confirmTarget?.isActive
            ? `${confirmTarget.nama} tidak dapat masuk sampai diaktifkan kembali.`
            : `${confirmTarget?.nama} dapat masuk kembali ke sistem.`
        }
        confirmLabel={confirmTarget?.isActive ? t.users.deactivate : t.users.reactivate}
        danger={confirmTarget?.isActive}
        onConfirm={() => confirmTarget && void handleToggle(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t.users.new}</h2>
            {formError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t.customers.full_name}</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t.users.username}</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t.login.password}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t.users.role}</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, branchId: '' })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="kasir">{t.users.role_kasir}</option>
                  <option value="admin">{t.users.role_admin}</option>
                </select>
              </div>
              {form.role === 'kasir' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t.nav.branches} <span className="text-red-500">*</span></label>
                  <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="">-- {t.common.filter} --</option>
                    {branches.filter((b) => b.isActive).map((b) => (
                      <option key={b.id} value={b.id}>{b.nama} ({b.kode})</option>
                    ))}
                  </select>
                </div>
              )}
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

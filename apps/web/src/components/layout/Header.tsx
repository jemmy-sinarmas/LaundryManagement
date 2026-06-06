'use client';
import { useRouter } from 'next/navigation';
import { useLangStore } from '@/store/langStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { lang, setLang } = useLangStore();
  const { user, clear } = useAuthStore();

  async function handleLogout() {
    try { await api.delete('/api/v1/auth/logout'); } catch { /* cookie still cleared below */ }
    clear();
    router.push('/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      {/* Left: logged-in user */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User size={15} className="text-gray-400" />
        <span className="font-medium text-gray-900">{user?.nama ?? '—'}</span>
        {user?.role && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500">
            {user.role}
          </span>
        )}
      </div>

      {/* Right: language toggle + logout */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
        >
          {lang === 'id' ? 'EN' : 'ID'}
        </button>
        <button
          onClick={() => void handleLogout()}
          className="flex items-center gap-1.5 rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={14} />
          {lang === 'id' ? 'Keluar' : 'Logout'}
        </button>
      </div>
    </header>
  );
}

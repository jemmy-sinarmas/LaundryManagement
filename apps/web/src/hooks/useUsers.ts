import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { User } from '@laundry-palu/shared';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<User[]>('/api/v1/users');
      setUsers(data);
    } catch {
      setError('Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function createUser(data: {
    nama: string;
    username: string;
    password: string;
    role: string;
  }): Promise<User> {
    const user = await api.post<User>('/api/v1/users', data);
    setUsers((prev) => [...prev, user]);
    return user;
  }

  async function toggleActive(id: string, isActive: boolean): Promise<void> {
    const updated = await api.patch<User>(`/api/v1/users/${id}`, { isActive });
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }

  return { users, loading, error, createUser, toggleActive, refetch: fetchUsers };
}

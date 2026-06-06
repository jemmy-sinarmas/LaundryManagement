import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Item } from '@laundry-palu/shared';

export function useItems(includeInactive = false) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = includeInactive ? '?include_inactive=true' : '';
      const data = await api.get<Item[]>(`/api/v1/items${params}`);
      setItems(data);
    } catch {
      setError('Gagal memuat daftar layanan');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  async function createItem(data: { nama: string; tipe: string; harga: number }): Promise<Item> {
    const item = await api.post<Item>('/api/v1/items', data);
    setItems((prev) => [...prev, item]);
    return item;
  }

  async function updateItem(id: string, data: { nama?: string; harga?: number }): Promise<void> {
    const updated = await api.patch<Item>(`/api/v1/items/${id}`, data);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  }

  async function deactivateItem(id: string): Promise<void> {
    await api.delete(`/api/v1/items/${id}`);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isActive: false } : i)));
  }

  async function activateItem(id: string): Promise<void> {
    const updated = await api.patch<Item>(`/api/v1/items/${id}`, { isActive: true });
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  }

  return { items, loading, error, createItem, updateItem, deactivateItem, activateItem, refetch: fetchItems };
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { InventoryItem, InventoryTransaction } from '@laundry-palu/shared';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [all, low] = await Promise.all([
        api.get<InventoryItem[]>('/api/v1/inventory'),
        api.get<InventoryItem[]>('/api/v1/inventory/low-stock'),
      ]);
      setItems(all);
      setLowStock(low);
    } catch {
      setError('Gagal memuat data inventori');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function createItem(data: {
    nama: string;
    satuan: string;
    stokMinimum: number;
  }): Promise<InventoryItem> {
    const item = await api.post<InventoryItem>('/api/v1/inventory', data);
    setItems((prev) => [...prev, item]);
    return item;
  }

  async function recordPurchase(
    id: string,
    data: { qty: number; hargaPerUnit: number; referensi?: string | null }
  ): Promise<InventoryTransaction> {
    const tx = await api.post<InventoryTransaction>(`/api/v1/inventory/${id}/purchase`, data);
    // Refresh items to show updated qty + FIFO avg
    const [all, low] = await Promise.all([
      api.get<InventoryItem[]>('/api/v1/inventory'),
      api.get<InventoryItem[]>('/api/v1/inventory/low-stock'),
    ]);
    setItems(all);
    setLowStock(low);
    return tx;
  }

  async function getTransactions(id: string): Promise<InventoryTransaction[]> {
    return api.get<InventoryTransaction[]>(`/api/v1/inventory/${id}/transactions`);
  }

  return { items, lowStock, loading, error, createItem, recordPurchase, getTransactions, refetch: fetchAll };
}

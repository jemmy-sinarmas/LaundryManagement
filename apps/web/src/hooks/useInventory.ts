import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { InventoryItem, InventoryTransaction } from '@laundry-palu/shared';

export interface UseInventoryOptions {
  includeInactive?: boolean;
  branchId?: string | null;
}

export function useInventory(options: UseInventoryOptions = {}) {
  const { includeInactive = false, branchId } = options;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildParams = useCallback((extra: Record<string, string> = {}): string => {
    const params = new URLSearchParams(extra);
    if (includeInactive) params.set('include_inactive', 'true');
    if (branchId) params.set('branch_id', branchId);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [includeInactive, branchId]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = buildParams();
      const branchQs = branchId ? `?branch_id=${branchId}` : '';
      const [all, low] = await Promise.all([
        api.get<InventoryItem[]>(`/api/v1/inventory${qs}`),
        api.get<InventoryItem[]>(`/api/v1/inventory/low-stock${branchQs}`),
      ]);
      setItems(all);
      setLowStock(low);
    } catch {
      setError('Gagal memuat data inventori');
    } finally {
      setLoading(false);
    }
  }, [buildParams, branchId]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function createItem(data: {
    nama: string;
    satuan: string;
    stokMinimum: number;
    branchId: string;
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
    const qs = buildParams();
    const branchQs = branchId ? `?branch_id=${branchId}` : '';
    const [all, low] = await Promise.all([
      api.get<InventoryItem[]>(`/api/v1/inventory${qs}`),
      api.get<InventoryItem[]>(`/api/v1/inventory/low-stock${branchQs}`),
    ]);
    setItems(all);
    setLowStock(low);
    return tx;
  }

  async function bulkPurchase(data: {
    items: Array<{ itemId: string; qty: number; hargaPerUnit: number; referensi?: string | null }>;
    fotoReferensi?: string;
  }): Promise<InventoryTransaction[]> {
    const txs = await api.post<InventoryTransaction[]>('/api/v1/inventory/bulk-purchase', data);
    const qs = buildParams();
    const branchQs = branchId ? `?branch_id=${branchId}` : '';
    const [all, low] = await Promise.all([
      api.get<InventoryItem[]>(`/api/v1/inventory${qs}`),
      api.get<InventoryItem[]>(`/api/v1/inventory/low-stock${branchQs}`),
    ]);
    setItems(all);
    setLowStock(low);
    return txs;
  }

  async function getTransactions(id: string): Promise<InventoryTransaction[]> {
    return api.get<InventoryTransaction[]>(`/api/v1/inventory/${id}/transactions`);
  }

  return { items, lowStock, loading, error, createItem, recordPurchase, bulkPurchase, getTransactions, refetch: fetchAll };
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Expense, ExpenseCategory, InventoryItem } from '@laundry-palu/shared';

export function useExpenses(filters?: { from?: string; to?: string; categoryId?: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);
      if (filters?.categoryId) params.set('category_id', filters.categoryId);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [exp, cats, inv] = await Promise.all([
        api.get<Expense[]>(`/api/v1/expenses${qs}`),
        api.get<ExpenseCategory[]>('/api/v1/expense-categories'),
        api.get<InventoryItem[]>('/api/v1/inventory'),
      ]);
      setExpenses(exp);
      setCategories(cats);
      setInventoryItems(inv);
    } catch {
      setError('Gagal memuat data pengeluaran');
    } finally {
      setLoading(false);
    }
  }, [filters?.from, filters?.to, filters?.categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function createExpense(data: {
    tanggal: string;
    jumlah: number;
    categoryId: string;
    deskripsi?: string | null;
    inventoryItemId?: string | null;
    qtyUsed?: number | null;
  }): Promise<Expense> {
    const expense = await api.post<Expense>('/api/v1/expenses', data);
    setExpenses((prev) => [expense, ...prev]);
    // Refresh inventory to show updated stock
    api.get<InventoryItem[]>('/api/v1/inventory').then(setInventoryItems).catch(() => null);
    return expense;
  }

  async function createCategory(data: { nama: string; level: string }): Promise<ExpenseCategory> {
    const cat = await api.post<ExpenseCategory>('/api/v1/expense-categories', data);
    setCategories((prev) => [...prev, cat]);
    return cat;
  }

  return {
    expenses, categories, inventoryItems,
    loading, error,
    createExpense, createCategory,
    refetch: fetchAll,
  };
}

'use client';
import { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useLangStore } from '@/store/langStore';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { formatIDR } from '@/lib/utils';

const LEVEL_COLORS: Record<string, string> = {
  variabel: 'bg-orange-100 text-orange-700',
  tetap:    'bg-blue-100 text-blue-700',
};

export default function ExpensesPage() {
  const { expenses, categories, inventoryItems, loading, error, createExpense } = useExpenses();
  const { t } = useLangStore();
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(data: Parameters<typeof createExpense>[0]) {
    await createExpense(data);
    setShowForm(false);
    setSuccessMsg(t.expenses.save_success);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  const total = expenses.reduce((s, e) => s + e.jumlah, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.expenses.title}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500">
              Total: <span className="font-medium text-gray-900">{formatIDR(total)}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href="/expenses/categories"
            className="rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t.expenses.categories_link}
          </a>
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.expenses.new}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Quick-entry panel */}
      {showForm && (
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">{t.expenses.form_title}</h2>
          <ExpenseForm
            categories={categories}
            inventoryItems={inventoryItems}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[t.expenses.date, t.expenses.amount, t.expenses.category, t.expenses.description, t.expenses.inventory_col].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">{t.common.loading}</td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  {t.expenses.empty}{' '}
                  <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">
                    {t.expenses.cta_add}
                  </button>
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{e.tanggal}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatIDR(e.jumlah)}</td>
                  <td className="px-4 py-3">
                    {e.category ? (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          LEVEL_COLORS[e.category.level] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {e.category.nama}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.deskripsi ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {e.inventoryItemId ? `${e.qtyUsed} unit` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

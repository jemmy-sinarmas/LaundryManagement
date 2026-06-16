'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/hooks/useReports';
import { useLangStore } from '@/store/langStore';
import StockAlert from '@/components/inventory/StockAlert';
import { formatIDR } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Branch, Item, User } from '@laundry-palu/shared';

const STATUS_COLORS: Record<string, string> = {
  diterima: 'bg-gray-100 text-gray-700', dicuci: 'bg-blue-100 text-blue-700',
  dikeringkan: 'bg-yellow-100 text-yellow-700', dibungkus: 'bg-purple-100 text-purple-700',
  siap_diambil: 'bg-green-100 text-green-700',
};

type SetupChecks = { branches: boolean; items: boolean; users: boolean; settings: boolean };

function SetupChecklist() {
  const { t } = useLangStore();
  const [dismissed, setDismissed] = useState(false);
  const [checks, setChecks] = useState<SetupChecks | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('setup_dismissed') === '1') {
      setDismissed(true);
      return;
    }
    void (async () => {
      const [branches, items, users, settings] = await Promise.allSettled([
        api.get<Branch[]>('/api/v1/branches'),
        api.get<Item[]>('/api/v1/items'),
        api.get<User[]>('/api/v1/users'),
        api.get<{ namaBisnis?: string }>('/api/v1/settings'),
      ]);
      setChecks({
        branches: branches.status === 'fulfilled' && branches.value.length > 0,
        items:    items.status === 'fulfilled'    && items.value.length > 0,
        users:    users.status === 'fulfilled'    && users.value.length > 0,
        settings: settings.status === 'fulfilled' && !!settings.value?.namaBisnis,
      });
    })();
  }, []);

  if (dismissed || checks === null) return null;
  if (Object.values(checks).every(Boolean)) return null;

  function dismiss() {
    localStorage.setItem('setup_dismissed', '1');
    setDismissed(true);
  }

  const steps: Array<{ done: boolean; label: string; href: string }> = [
    { done: checks.branches, label: t.dashboard.setup_branches, href: '/branches' },
    { done: checks.items,    label: t.dashboard.setup_items,    href: '/items' },
    { done: checks.users,    label: t.dashboard.setup_users,    href: '/users' },
    { done: checks.settings, label: t.dashboard.setup_settings, href: '/settings' },
  ];

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-800">{t.dashboard.setup_title}</p>
          <p className="mt-0.5 text-xs text-blue-600">{t.dashboard.setup_subtitle}</p>
        </div>
        <button onClick={dismiss} className="shrink-0 text-xs text-blue-400 hover:text-blue-600">
          {t.dashboard.setup_dismiss}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {steps.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              s.done
                ? 'border-green-300 bg-green-50 text-green-700 line-through opacity-60'
                : 'border-blue-300 bg-white text-blue-700 hover:bg-blue-100'
            }`}
          >
            {s.done ? '✓' : '○'} {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, monthlyData, loading, error } = useDashboard();
  const { t } = useLangStore();

  if (loading) return <p className="text-sm text-gray-400">{t.common.loading}</p>;
  if (error || !data) return (
    <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error ?? t.common.error}
    </div>
  );

  const chartData = (monthlyData?.revenueByDay ?? []).map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenue / 1000,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>

      <SetupChecklist />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label={t.dashboard.revenue_today} value={formatIDR(data.revenueToday)} />
        <KpiCard label={t.dashboard.revenue_week} value={formatIDR(data.revenueThisWeek)} />
        <KpiCard label={t.dashboard.revenue_month} value={formatIDR(data.revenueThisMonth)} />
      </div>

      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">{t.dashboard.orders_active}</h2>
        {data.ordersByStatus.length === 0 ? (
          <p className="text-sm text-gray-400">{t.dashboard.orders_empty}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data.ordersByStatus.map(({ status, count }) => (
              <div
                key={status}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                  STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                <span>{t.status[status as keyof typeof t.status] ?? status}</span>
                <span className="rounded-full bg-white/60 px-1.5 text-xs font-bold">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">{t.dashboard.chart_title}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`Rp ${v.toFixed(0)}k`, t.dashboard.chart_tooltip]} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">{t.dashboard.top5_title}</h2>
          {data.top5Customers.length === 0 ? (
            <p className="text-sm text-gray-400">{t.dashboard.top5_empty}</p>
          ) : (
            <div className="space-y-2">
              {data.top5Customers.map((c, i) => (
                <div key={c.customerId} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-gray-400">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{c.nama}</p>
                    <p className="text-xs text-gray-400">{c.orderCount} {t.dashboard.orders_count}</p>
                  </div>
                  <span className="text-sm font-medium text-blue-700">{formatIDR(c.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {data.lowStockItems.length > 0 ? (
            <StockAlert items={data.lowStockItems} />
          ) : (
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-gray-900">{t.dashboard.stock_title}</h2>
              <p className="text-sm text-green-700">{t.dashboard.stock_safe}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useLangStore } from '@/store/langStore';

export default function ReportsIndexPage() {
  const { t } = useLangStore();

  const REPORTS = [
    { href: '/reports/daily',            title: t.reports.daily,            description: t.reports.daily_desc },
    { href: '/reports/daily-position',   title: t.reports.daily_position,   description: t.reports.daily_position_desc },
    { href: '/reports/monthly',          title: t.reports.monthly,          description: t.reports.monthly_desc },
    { href: '/reports/income-statement', title: t.reports.income_statement, description: t.reports.income_statement_desc },
    { href: '/reports/sales',            title: t.reports.sales,            description: t.reports.sales_desc },
    { href: '/reports/transactions',     title: t.reports.transactions,     description: t.reports.transactions_desc },
    { href: '/reports/invoices',         title: t.reports.invoices,         description: t.reports.invoices_desc },
    { href: '/reports/shifts',           title: t.reports.shifts,           description: t.reports.shifts_desc },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t.reports.title}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <h2 className="mb-1 text-lg font-semibold text-gray-900">{r.title}</h2>
            <p className="text-sm text-gray-500">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

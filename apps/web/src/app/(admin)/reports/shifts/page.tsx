'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { DatePeriodFilter, computePreset } from '@/components/DatePeriodFilter';
import type { DateRange } from '@/components/DatePeriodFilter';
import type { Branch } from '@laundry-palu/shared';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useLangStore } from '@/store/langStore';

type ShiftReportItem = {
  id: string;
  kasirNama: string;
  kasirUsername: string;
  branchNama: string;
  startTime: string;
  endTime: string | null;
  startCash: number;
  endCash: number | null;
  notes: string | null;
  orderCount: number;
};

type ShiftsData = {
  from: string;
  to: string;
  shifts: ShiftReportItem[];
};

function formatDuration(start: string, end: string | null): string {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}j ${m}m`;
}

function shortDatetime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ShiftsReportPage() {
  const { t } = useLangStore();
  const [range, setRange] = useState<DateRange>(computePreset('this_month'));
  const [filterBranch, setFilterBranch] = useState('');
  const [data, setData] = useState<ShiftsData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Branch[]>('/api/v1/branches').then(setBranches).catch(() => undefined);
  }, []);

  const fetchData = useCallback(async (r: DateRange, branchId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: r.from, to: r.to });
      if (branchId) params.set('branch_id', branchId);
      const result = await api.get<ShiftsData>(`/api/v1/reports/shifts?${params.toString()}`);
      setData(result);
    } catch {
      setError('Gagal memuat laporan shift');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(range, filterBranch); }, [fetchData, range, filterBranch]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t.reports.title, href: '/reports' }, { label: t.reports.shifts }]} />
      <h1 className="text-2xl font-bold text-gray-900">{t.reports.shifts}</h1>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <DatePeriodFilter value={range} onChange={setRange} />
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t.common.all_branches}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.nama}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400">{t.common.loading}</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-semibold text-gray-900">Rekap Shift</h2>
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
              {data.shifts.length} shift
            </span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Kasir', 'Cabang', 'Mulai Shift', 'Akhir Shift', 'Durasi', 'Modal Awal', 'Modal Akhir', 'Jml. Order', 'Catatan'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.shifts.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-400">Tidak ada shift dalam periode ini.</td></tr>
              ) : (
                data.shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{s.kasirNama}</p>
                      <p className="text-xs text-gray-400">@{s.kasirUsername}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.branchNama}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">{shortDatetime(s.startTime)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                      {s.endTime ? shortDatetime(s.endTime) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Aktif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDuration(s.startTime, s.endTime)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatIDR(s.startCash)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.endCash !== null ? formatIDR(s.endCash) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">{s.orderCount}</td>
                    <td className="max-w-[160px] px-4 py-3 text-xs text-gray-500">{s.notes ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

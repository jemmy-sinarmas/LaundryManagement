'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: string;
  to: string;
}

type Preset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom';

const PRESET_LABELS: Record<Preset, string> = {
  today:      'Hari Ini',
  yesterday:  'Kemarin',
  this_week:  'Minggu Ini',
  last_week:  'Minggu Lalu',
  this_month: 'Bulan Ini',
  last_month: 'Bulan Lalu',
  this_year:  'Tahun Ini',
  last_year:  'Tahun Lalu',
  custom:     'Kustom',
};

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computePreset(preset: Preset): DateRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'today': {
      const t = toYMD(now);
      return { from: t, to: t };
    }
    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const t = toYMD(d);
      return { from: t, to: t };
    }
    case 'this_week': {
      const day = now.getDay(); // 0=Sun
      const diff = (day + 6) % 7; // days since Monday
      const mon = new Date(now);
      mon.setDate(now.getDate() - diff);
      return { from: toYMD(mon), to: toYMD(now) };
    }
    case 'last_week': {
      const day = now.getDay();
      const diff = (day + 6) % 7;
      const thisMon = new Date(now);
      thisMon.setDate(now.getDate() - diff);
      const lastMon = new Date(thisMon);
      lastMon.setDate(thisMon.getDate() - 7);
      const lastSun = new Date(thisMon);
      lastSun.setDate(thisMon.getDate() - 1);
      return { from: toYMD(lastMon), to: toYMD(lastSun) };
    }
    case 'this_month': {
      const first = new Date(y, m, 1);
      return { from: toYMD(first), to: toYMD(now) };
    }
    case 'last_month': {
      const first = new Date(y, m - 1, 1);
      const last  = new Date(y, m, 0);
      return { from: toYMD(first), to: toYMD(last) };
    }
    case 'this_year': {
      const first = new Date(y, 0, 1);
      return { from: toYMD(first), to: toYMD(now) };
    }
    case 'last_year': {
      const first = new Date(y - 1, 0, 1);
      const last  = new Date(y - 1, 11, 31);
      return { from: toYMD(first), to: toYMD(last) };
    }
    case 'custom':
      return { from: toYMD(now), to: toYMD(now) };
  }
}

function detectPreset(value: DateRange): Preset {
  const presets: Preset[] = [
    'today', 'yesterday', 'this_week', 'last_week',
    'this_month', 'last_month', 'this_year', 'last_year',
  ];
  for (const p of presets) {
    const range = computePreset(p);
    if (range.from === value.from && range.to === value.to) return p;
  }
  return 'custom';
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DatePeriodFilter({ value, onChange }: Props) {
  const activePreset = detectPreset(value);
  const [showCustom, setShowCustom] = useState(activePreset === 'custom');

  function selectPreset(p: Preset) {
    if (p === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(computePreset(p));
  }

  const presets: Preset[] = [
    'today', 'yesterday', 'this_week', 'last_week',
    'this_month', 'last_month', 'this_year', 'last_year', 'custom',
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => selectPreset(p)}
            className={cn(
              'rounded border px-3 py-1.5 text-xs font-medium transition-colors',
              (activePreset === p || (p === 'custom' && showCustom))
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            )}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Dari</label>
            <input
              type="date"
              value={value.from}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <span className="mt-4 text-gray-400">—</span>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Sampai</label>
            <input
              type="date"
              value={value.to}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

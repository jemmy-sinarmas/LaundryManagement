'use client';
import { useState } from 'react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useDailyPosition } from '@/hooks/useReports';
import { useLangStore } from '@/store/langStore';
import { Printer } from 'lucide-react';

function Row({
  label,
  value,
  indent,
  strong,
  highlight,
}: {
  label: string;
  value?: number;
  indent?: boolean;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-gray-100' : ''}>
      <td
        className={`border border-gray-400 px-3 py-1.5 text-sm ${indent ? 'pl-8' : ''} ${
          strong ? 'font-bold' : ''
        }`}
      >
        {label}
      </td>
      <td className="w-10 border border-gray-400 px-2 py-1.5 text-sm text-gray-500">
        {value === undefined ? '' : 'Rp'}
      </td>
      <td
        className={`w-40 border border-gray-400 px-3 py-1.5 text-right text-sm tabular-nums ${
          strong ? 'font-bold' : ''
        }`}
      >
        {value === undefined ? '' : value === 0 ? '-' : value.toLocaleString('id-ID')}
      </td>
    </tr>
  );
}

export default function DailyPositionReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data, loading, error } = useDailyPosition(date);
  const { t } = useLangStore();

  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <Breadcrumb items={[{ label: t.reports.title, href: '/reports' }, { label: t.reports.daily_position }]} />
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">{t.reports.daily_position}</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer size={15} />
            Cetak
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">{t.common.loading}</p>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="mx-auto max-w-md">
          <table className="w-full border-collapse">
            <tbody>
              {/* Title */}
              <tr>
                <td
                  colSpan={3}
                  className="border border-gray-400 bg-gray-50 px-3 py-2 text-center text-sm font-bold uppercase"
                >
                  Laporan Harian
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="border border-gray-400 bg-gray-50 px-3 py-1.5 text-center text-sm font-semibold uppercase"
                >
                  Posisi Per Tanggal {formattedDate}
                </td>
              </tr>

              {/* Position */}
              <Row label="KAS" value={data.kas} />
              <Row label="PIUTANG" value={data.piutang} />

              {/* spacer */}
              <tr>
                <td colSpan={3} className="py-1.5" />
              </tr>

              {/* Daily transactions */}
              <Row label="TRANSAKSI HARIAN" strong />
              <Row label="KAS MASUK/TOTAL TUNAI" value={data.kasMasuk} />
              <Row label="KAS KELUAR" value={data.kasKeluar} />
              <Row label="TRF MASUK :" value={data.trfMasuk} />
              <Row label="1. QRIS" value={data.trfMasukQris} indent />
              <Row label="2. TRF BCA" value={data.trfMasukBca} indent />
              <Row label="TRF KELUAR" value={data.trfKeluar} />

              {/* spacer */}
              <tr>
                <td colSpan={3} className="py-1.5" />
              </tr>

              <Row label="TOTAL OMSET HARIAN" value={data.totalOmset} strong highlight />
              <Row
                label="TOTAL BIAYA (kas keluar + trf keluar)"
                value={data.totalBiaya}
                strong
                highlight
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

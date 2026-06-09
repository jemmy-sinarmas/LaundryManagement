import Link from 'next/link';

const REPORTS = [
  {
    href: '/reports/daily',
    title: 'Laporan Harian',
    description: 'Ringkasan penjualan dan pengeluaran per hari',
  },
  {
    href: '/reports/monthly',
    title: 'Laporan Bulanan',
    description: 'Rekap pendapatan dan pengeluaran per bulan',
  },
  {
    href: '/reports/income-statement',
    title: 'Laporan Laba Rugi',
    description: 'Laporan laba rugi dalam rentang waktu tertentu',
  },
  {
    href: '/reports/sales',
    title: 'Laporan Penjualan',
    description: 'Analisis pendapatan per jenis layanan dan item terlaris',
  },
  {
    href: '/reports/transactions',
    title: 'Laporan Transaksi',
    description: 'Semua transaksi pesanan dalam periode tertentu',
  },
  {
    href: '/reports/invoices',
    title: 'Laporan Faktur',
    description: 'Daftar faktur dengan pencarian dan preview nota',
  },
  {
    href: '/reports/shifts',
    title: 'Laporan Shift',
    description: 'Rekap shift kasir beserta modal dan jumlah pesanan',
  },
];

export default function ReportsIndexPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Laporan</h1>
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

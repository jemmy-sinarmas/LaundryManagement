import type { InventoryTransaction } from '@laundry-palu/shared';
import { formatIDR } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

type Props = {
  transactions: InventoryTransaction[];
  satuan: string;
  loading?: boolean;
};

export default function TransactionHistory({ transactions, satuan, loading }: Props) {
  if (loading) {
    return <p className="py-4 text-center text-sm text-gray-400">Memuat riwayat...</p>;
  }

  if (transactions.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">Belum ada transaksi.</p>;
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const isMasuk = tx.tipe === 'masuk';
        return (
          <div key={tx.id} className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                isMasuk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {isMasuk ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-sm font-medium ${
                    isMasuk ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {isMasuk ? '+' : '-'}{tx.qty} {satuan}
                </span>
                {tx.hargaPerUnit !== null && (
                  <span className="text-xs text-gray-400">
                    @ {formatIDR(tx.hargaPerUnit)} / {satuan}
                  </span>
                )}
              </div>
              {tx.referensi && (
                <p className="text-xs text-gray-500 truncate">{tx.referensi}</p>
              )}
              <p className="text-xs text-gray-400">{tx.createdAt.slice(0, 16).replace('T', ' ')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

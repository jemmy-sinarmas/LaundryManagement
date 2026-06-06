import type { InventoryItem } from '@laundry-palu/shared';
import { AlertTriangle } from 'lucide-react';

type Props = { items: InventoryItem[] };

export default function StockAlert({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <div className="flex items-center gap-2 font-medium text-yellow-800">
        <AlertTriangle size={16} />
        {items.length} item stok rendah
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm text-yellow-700">
            <span>{item.nama}</span>
            <span className="font-medium">
              {item.qtySaatIni} / {item.stokMinimum} {item.satuan}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';
import QRCode from 'react-qr-code';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@laundry-palu/shared';

type Props = {
  order: Order;
  onClose: () => void;
};

export default function PrintableInvoice({ order, onClose }: Props) {
  const trackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/track/${order.invoiceNo}`
      : `/track/${order.invoiceNo}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:inset-auto">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white shadow-xl print:shadow-none print:rounded-none print:max-h-none">
        {/* Invoice content */}
        <div className="p-6 print:p-4">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold">Laundry Palu</h2>
            <p className="text-sm text-gray-500">{order.createdAt.slice(0, 10)}</p>
          </div>

          <div className="mb-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">No. Invoice</span>
              <span className="font-medium">{order.invoiceNo}</span>
            </div>
            {order.customer && (
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-500">Pelanggan</span>
                <span className="font-medium">{order.customer.nama}</span>
              </div>
            )}
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <table className="mb-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-right">Qty</th>
                  <th className="pb-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-1">{item.namaItem}</td>
                    <td className="py-1 text-right">{item.qty}</td>
                    <td className="py-1 text-right">{formatIDR(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <div className="mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatIDR(order.subtotal)}</span>
            </div>
            {order.diskonAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Diskon ({order.diskonPersen}%)</span>
                <span>- {formatIDR(order.diskonAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span>{formatIDR(order.total)}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 py-4">
            <QRCode value={trackUrl} size={120} />
            <p className="text-xs text-gray-400">Scan untuk lacak pesanan</p>
          </div>

          {order.catatan && (
            <p className="mt-2 text-xs text-gray-500">Catatan: {order.catatan}</p>
          )}
        </div>

        {/* Actions (hidden when printing) */}
        <div className="flex gap-3 border-t p-4 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Cetak
          </button>
        </div>
      </div>
    </div>
  );
}

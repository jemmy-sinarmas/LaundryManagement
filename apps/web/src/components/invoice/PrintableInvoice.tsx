'use client';
import QRCode from 'react-qr-code';
import { Bluetooth, BluetoothConnected } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import type { Order } from '@laundry-palu/shared';
import { useBluetooth } from '@/hooks/useBluetooth';
import { useSettings } from '@/hooks/useSettings';

type Props = {
  order: Order;
  onClose: () => void;
};

export default function PrintableInvoice({ order, onClose }: Props) {
  const { connected, connecting, printing, btError, connect, printReceipt, setBtError } = useBluetooth();
  const { settings } = useSettings();
  const qrUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/track/t/${order.pickupToken ?? order.invoiceNo}`
      : `/track/t/${order.pickupToken ?? order.invoiceNo}`;

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
                <span>Diskon Member ({order.diskonPersen}%)</span>
                <span>- {formatIDR(order.diskonAmount)}</span>
              </div>
            )}
            {(order.promoDiskonAmount ?? 0) > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>Diskon Promo</span>
                <span>- {formatIDR(order.promoDiskonAmount ?? 0)}</span>
              </div>
            )}
            {(order.gratuityAmount ?? 0) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan</span>
                <span>+ {formatIDR(order.gratuityAmount ?? 0)}</span>
              </div>
            )}
            {(order.ppnAmount ?? 0) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>PPN</span>
                <span>+ {formatIDR(order.ppnAmount ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span>{formatIDR(order.total)}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 py-4">
            <QRCode value={qrUrl} size={120} />
            <p className="text-xs text-gray-400">Scan untuk lacak status pesanan</p>
          </div>

          {order.catatan && (
            <p className="mt-2 text-xs text-gray-500">Catatan: {order.catatan}</p>
          )}
        </div>

        {/* Actions (hidden when printing) */}
        <div className="space-y-2 border-t p-4 print:hidden">
          {btError && (
            <p className="text-xs text-red-600">{btError}</p>
          )}
          <div className="flex gap-3">
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
          <div className="flex gap-3">
            {!connected ? (
              <button
                onClick={() => { setBtError(null); void connect(); }}
                disabled={connecting}
                className="flex flex-1 items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Bluetooth size={14} />
                {connecting ? 'Menghubungkan...' : 'Hubungkan Printer BT'}
              </button>
            ) : (
              <button
                onClick={() => { if (settings) void printReceipt(order, settings); }}
                disabled={printing || !settings}
                className="flex flex-1 items-center justify-center gap-2 rounded border border-green-600 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
              >
                <BluetoothConnected size={14} />
                {printing ? 'Mencetak...' : 'Cetak via Bluetooth'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

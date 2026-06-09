'use client';
import { useState, useCallback } from 'react';
import type { Order, AppSettings } from '@laundry-palu/shared';
import * as escpos from '@/lib/escpos';
import { formatIDR } from '@/lib/utils';

// Minimal Web Bluetooth API type definitions
type BtCharacteristic = {
  writeValueWithoutResponse(value: ArrayBuffer): Promise<void>;
  writeValue(value: ArrayBuffer): Promise<void>;
};
type BtService = { getCharacteristic(uuid: string): Promise<BtCharacteristic> };
type BtGATT = {
  connected: boolean;
  connect(): Promise<BtGATT>;
  getPrimaryService(uuid: string): Promise<BtService>;
};
type BtDevice = { name?: string; gatt?: BtGATT };
type NavigatorBluetooth = {
  requestDevice(opts: {
    acceptAllDevices?: boolean;
    filters?: Array<{ services?: string[]; namePrefix?: string }>;
    optionalServices?: string[];
  }): Promise<BtDevice>;
};

const SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];
const CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
];
const CHUNK_SIZE = 512;

async function writeInChunks(char: BtCharacteristic, data: Uint8Array) {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    try {
      await char.writeValueWithoutResponse(chunk.buffer);
    } catch {
      await char.writeValue(chunk.buffer);
    }
  }
}

async function getCharacteristic(gatt: BtGATT): Promise<BtCharacteristic> {
  for (const svcUuid of SERVICE_UUIDS) {
    try {
      const svc = await gatt.getPrimaryService(svcUuid);
      for (const charUuid of CHARACTERISTIC_UUIDS) {
        try {
          return await svc.getCharacteristic(charUuid);
        } catch { /* try next */ }
      }
    } catch { /* try next service */ }
  }
  throw new Error('Karakteristik printer tidak ditemukan. Pastikan printer ESC/POS terhubung.');
}

export function useBluetooth() {
  const [device, setDevice] = useState<BtDevice | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [btError, setBtError] = useState<string | null>(null);

  const getBluetooth = (): NavigatorBluetooth | null => {
    const nav = navigator as unknown as { bluetooth?: NavigatorBluetooth };
    return nav.bluetooth ?? null;
  };

  const connect = useCallback(async () => {
    const bt = getBluetooth();
    if (!bt) {
      setBtError('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android.');
      return;
    }
    setConnecting(true);
    setBtError(null);
    try {
      const dev = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: SERVICE_UUIDS,
      });
      if (!dev.gatt) throw new Error('GATT server tidak tersedia');
      await dev.gatt.connect();
      setDevice(dev);
      setConnected(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungkan printer';
      if (!msg.includes('cancelled')) setBtError(msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setDevice(null);
    setConnected(false);
  }, []);

  const printReceipt = useCallback(async (order: Order, settings: AppSettings) => {
    if (!device?.gatt) {
      setBtError('Printer belum terhubung');
      return;
    }
    setPrinting(true);
    setBtError(null);
    try {
      if (!device.gatt.connected) await device.gatt.connect();
      const char = await getCharacteristic(device.gatt);

      const parts: Uint8Array[] = [escpos.init()];

      if (settings.logoBase64) {
        try {
          const logoBytes = await escpos.printImage(settings.logoBase64);
          parts.push(escpos.align('center'), logoBytes, escpos.lineFeed(1));
        } catch { /* skip logo on error */ }
      }

      parts.push(
        escpos.align('center'),
        escpos.bold(true),
        escpos.text(`${settings.businessName}\n`),
        escpos.bold(false),
      );
      if (settings.businessAddress) {
        parts.push(escpos.text(`${settings.businessAddress}\n`));
      }
      if (settings.businessPhone) {
        parts.push(escpos.text(`${settings.businessPhone}\n`));
      }

      parts.push(
        escpos.text('--------------------------------\n'),
        escpos.align('left'),
        escpos.text(`Invoice: ${order.invoiceNo}\n`),
        escpos.text(`Tgl: ${order.createdAt.slice(0, 10)}\n`),
      );
      if (order.customer) {
        parts.push(escpos.text(`Pelanggan: ${order.customer.nama}\n`));
      }
      parts.push(escpos.text('--------------------------------\n'));

      for (const item of order.items ?? []) {
        const line = `${item.namaItem}\n  ${item.qty} x ${formatIDR(item.harga)}  ${formatIDR(item.subtotal)}\n`;
        parts.push(escpos.text(line));
      }

      parts.push(escpos.text('--------------------------------\n'));
      if (order.diskonAmount > 0) {
        parts.push(
          escpos.text(`Subtotal: ${formatIDR(order.subtotal)}\n`),
          escpos.text(`Diskon (${order.diskonPersen}%): -${formatIDR(order.diskonAmount)}\n`),
        );
      }
      parts.push(
        escpos.bold(true),
        escpos.text(`TOTAL: ${formatIDR(order.total)}\n`),
        escpos.bold(false),
        escpos.text('--------------------------------\n'),
      );

      if (settings.invoiceFooter) {
        parts.push(
          escpos.align('center'),
          escpos.text(`${settings.invoiceFooter}\n`),
        );
      }

      parts.push(escpos.feedLines(4), escpos.cut());

      const payload = escpos.concat(...parts);
      await writeInChunks(char, payload);
    } catch (err: unknown) {
      setBtError(err instanceof Error ? err.message : 'Gagal mencetak');
    } finally {
      setPrinting(false);
    }
  }, [device]);

  return { connected, connecting, printing, btError, connect, disconnect, printReceipt, setBtError };
}

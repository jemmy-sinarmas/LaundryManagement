import { describe, it, expect } from 'vitest';
import type {
  AppSettings,
  Branch,
  Customer,
  MessageTemplate,
  Order,
} from '@laundry-palu/shared';
import {
  renderPaymentReceipt,
  renderReadyForCollection,
  normalizePhone,
  formatNumber,
  substitutePlaceholders,
  type ReceiptContext,
} from '../../src/lib/whatsapp/render.js';

const settings: AppSettings = {
  businessName: 'Laundry Palu',
  businessAddress: 'Jl. Sriwijaya',
  businessPhone: '+62 822 1111 2222',
  invoiceFooter: '',
  logoBase64: '',
  ppnPercent: 0,
  gratuityPercent: 0,
  saldoAwalKas: 0,
  whatsappEnabled: false,
  whatsappProvider: '',
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappSender: '',
};

const customer: Customer = {
  id: 'c1',
  nama: 'Robert',
  alamat: 'jl. Sriwijaya no.20',
  noHp: '081703798952',
  countryCode: '+62',
  createdAt: '2026-06-14T00:00:00Z',
  updatedAt: '2026-06-14T00:00:00Z',
};

const branch: Branch = {
  id: 'b1',
  nama: 'Palu',
  kode: '063',
  alamat: 'Palu',
  isActive: true,
  createdAt: '2026-06-14T00:00:00Z',
  updatedAt: '2026-06-14T00:00:00Z',
};

const order: Order = {
  id: 'o1',
  invoiceNo: 'INV-063-20260614-0005',
  customerId: 'c1',
  membershipId: null,
  diskonPersen: 20,
  subtotal: 92500,
  diskonAmount: 18500,
  promoId: null,
  promoDiskonAmount: 0,
  gratuityAmount: 0,
  ppnAmount: 0,
  total: 74000,
  metodePembayaran: 'tunai',
  jumlahDibayar: 74000,
  status: 'siap_diambil',
  catatan: null,
  branchId: 'b1',
  pickupToken: null,
  createdBy: 'u1',
  createdAt: '2026-06-14T10:00:00Z',
  updatedAt: '2026-06-14T10:00:00Z',
  items: [
    { id: 'i1', orderId: 'o1', itemId: 'it1', namaItem: 'Cuci Kering Setrika', tipe: 'kiloan', harga: 11000, qty: 5, subtotal: 55000 },
    { id: 'i2', orderId: 'o1', itemId: 'it2', namaItem: 'Sepatu Casual', tipe: 'satuan', harga: 37500, qty: 1, subtotal: 37500 },
  ],
};

const paymentTemplate: MessageTemplate = {
  id: 't1',
  type: 'payment_receipt',
  header: '{business_name}\nPalu\n{business_phone}',
  footer: 'Terima kasih {customer_name}!',
  isActive: true,
  createdAt: '2026-06-14T00:00:00Z',
  updatedAt: '2026-06-14T00:00:00Z',
};

const readyTemplate: MessageTemplate = {
  ...paymentTemplate,
  id: 't2',
  type: 'ready_for_collection',
  footer: 'Sampai jumpa!',
};

const ctx: ReceiptContext = { order, customer, branch, settings, creatorName: 'milawati-rcp' };

describe('render helpers', () => {
  it('formatNumber uses Indonesian thousands separator', () => {
    expect(formatNumber(55000)).toBe('55.000');
    expect(formatNumber(74000)).toBe('74.000');
  });

  it('normalizePhone strips symbols and leading zero of the local part', () => {
    expect(normalizePhone('+62', '081703798952')).toBe('6281703798952');
    expect(normalizePhone('+62', '81703798952')).toBe('6281703798952');
  });

  it('substitutePlaceholders replaces known keys and leaves unknown ones', () => {
    expect(substitutePlaceholders('Hi {customer_name} {unknown}', { customer_name: 'Bob' }))
      .toBe('Hi Bob {unknown}');
  });
});

describe('renderPaymentReceipt', () => {
  const msg = renderPaymentReceipt(paymentTemplate, ctx);

  it('substitutes header/footer placeholders', () => {
    expect(msg).toContain('Laundry Palu');
    expect(msg).toContain('+62 822 1111 2222');
    expect(msg).toContain('Terima kasih Robert!');
  });

  it('includes invoice, creator and customer block', () => {
    expect(msg).toContain('Invoice #INV-063-20260614-0005');
    expect(msg).toContain('Dibuat oleh: milawati-rcp');
    expect(msg).toContain('Robert');
    expect(msg).toContain('+6281703798952');
    expect(msg).toContain('jl. Sriwijaya no.20');
  });

  it('renders each item line with formatted qty/amount', () => {
    expect(msg).toContain('- Cuci Kering Setrika: 5,0 Kg - 55.000');
    expect(msg).toContain('- Sepatu Casual: 1 Pcs - 37.500');
  });

  it('renders the discount line and totals', () => {
    expect(msg).toContain('Diskon 20% - (18.500)');
    expect(msg).toContain('Total Order: Rp 74.000');
    expect(msg).toContain('Total Invoice: Rp 74.000');
  });
});

describe('renderReadyForCollection', () => {
  it('renders a short ready notice with invoice and total', () => {
    const msg = renderReadyForCollection(readyTemplate, ctx);
    expect(msg).toContain('Halo Robert,');
    expect(msg).toContain('SIAP DIAMBIL');
    expect(msg).toContain('INV-063-20260614-0005');
    expect(msg).toContain('Total: Rp 74.000');
    expect(msg).toContain('Sampai jumpa!');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { AppSettings, Customer, MessageTemplate, Order } from '@laundry-palu/shared';
import type { SqlDb } from '../../src/lib/db-types.js';

vi.mock('../../src/repositories/order.repo.js');
vi.mock('../../src/repositories/customer.repo.js');
vi.mock('../../src/repositories/branch.repo.js');
vi.mock('../../src/repositories/user.repo.js');
vi.mock('../../src/repositories/message-template.repo.js');
vi.mock('../../src/repositories/notification-log.repo.js');
vi.mock('../../src/services/settings.service.js');
vi.mock('../../src/lib/whatsapp/index.js');

import * as orderRepo from '../../src/repositories/order.repo.js';
import * as customerRepo from '../../src/repositories/customer.repo.js';
import * as branchRepo from '../../src/repositories/branch.repo.js';
import * as userRepo from '../../src/repositories/user.repo.js';
import * as templateRepo from '../../src/repositories/message-template.repo.js';
import * as notificationLogRepo from '../../src/repositories/notification-log.repo.js';
import * as settingsService from '../../src/services/settings.service.js';
import { getSender } from '../../src/lib/whatsapp/index.js';
import * as notificationService from '../../src/services/notification.service.js';

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
  ],
};

const activeTemplate: MessageTemplate = {
  id: 't1',
  type: 'payment_receipt',
  header: '{business_name}',
  footer: 'Terima kasih',
  isActive: true,
  createdAt: '2026-06-14T00:00:00Z',
  updatedAt: '2026-06-14T00:00:00Z',
};

const fastify = {
  db: {} as SqlDb,
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
} as unknown as FastifyInstance;

function happyPathMocks() {
  vi.mocked(templateRepo.findByType).mockResolvedValue(activeTemplate);
  vi.mocked(orderRepo.findById).mockResolvedValue(order);
  vi.mocked(customerRepo.findById).mockResolvedValue(customer);
  vi.mocked(branchRepo.findById).mockResolvedValue(null);
  vi.mocked(settingsService.getSettings).mockResolvedValue(settings);
  vi.mocked(userRepo.findById).mockResolvedValue({ nama: 'milawati' } as never);
  vi.mocked(notificationLogRepo.create).mockResolvedValue(undefined);
}

describe('notificationService.sendPaymentReceipt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the rendered receipt to the normalized number and logs the attempt', async () => {
    happyPathMocks();
    const send = vi.fn().mockResolvedValue({ status: 'skipped' });
    vi.mocked(getSender).mockReturnValue({ send });

    await notificationService.sendPaymentReceipt(fastify, 'o1');

    expect(send).toHaveBeenCalledTimes(1);
    const [toArg, msgArg] = send.mock.calls[0]!;
    expect(toArg).toBe('6281703798952');
    expect(msgArg).toContain('INV-063-20260614-0005');
    expect(msgArg).toContain('Laundry Palu');
    expect(msgArg).toContain('Cuci Kering Setrika');

    expect(notificationLogRepo.create).toHaveBeenCalledWith(
      fastify.db,
      expect.objectContaining({ orderId: 'o1', type: 'payment_receipt', toNumber: '6281703798952', status: 'skipped' })
    );
  });

  it('skips (no send, no log) when the template is inactive', async () => {
    happyPathMocks();
    vi.mocked(templateRepo.findByType).mockResolvedValue({ ...activeTemplate, isActive: false });
    const send = vi.fn();
    vi.mocked(getSender).mockReturnValue({ send });

    await notificationService.sendPaymentReceipt(fastify, 'o1');

    expect(send).not.toHaveBeenCalled();
    expect(notificationLogRepo.create).not.toHaveBeenCalled();
  });

  it('skips when the customer has no phone number', async () => {
    happyPathMocks();
    vi.mocked(customerRepo.findById).mockResolvedValue({ ...customer, noHp: '' });
    const send = vi.fn();
    vi.mocked(getSender).mockReturnValue({ send });

    await notificationService.sendPaymentReceipt(fastify, 'o1');

    expect(send).not.toHaveBeenCalled();
  });

  it('swallows a sender error and records status "failed"', async () => {
    happyPathMocks();
    const send = vi.fn().mockRejectedValue(new Error('gateway down'));
    vi.mocked(getSender).mockReturnValue({ send });

    await expect(notificationService.sendPaymentReceipt(fastify, 'o1')).resolves.toBeUndefined();

    expect(notificationLogRepo.create).toHaveBeenCalledWith(
      fastify.db,
      expect.objectContaining({ status: 'failed', error: 'gateway down' })
    );
  });
});

describe('notificationService.sendReadyForCollection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the ready_for_collection template', async () => {
    happyPathMocks();
    vi.mocked(templateRepo.findByType).mockResolvedValue({ ...activeTemplate, type: 'ready_for_collection' });
    const send = vi.fn().mockResolvedValue({ status: 'skipped' });
    vi.mocked(getSender).mockReturnValue({ send });

    await notificationService.sendReadyForCollection(fastify, 'o1');

    expect(templateRepo.findByType).toHaveBeenCalledWith(fastify.db, 'ready_for_collection');
    expect(send).toHaveBeenCalledTimes(1);
    const [, msgArg] = send.mock.calls[0]!;
    expect(msgArg).toContain('SIAP DIAMBIL');
  });
});

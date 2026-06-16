import { randomUUID } from 'node:crypto';
import type { Order, OrderStatus } from '@laundry-palu/shared';
import { ORDER_STATUSES, getPreviousStatus } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as orderRepo from '../repositories/order.repo.js';
import * as customerRepo from '../repositories/customer.repo.js';
import * as itemRepo from '../repositories/item.repo.js';
import * as membershipRepo from '../repositories/membership.repo.js';
import * as branchRepo from '../repositories/branch.repo.js';
import * as promotionRepo from '../repositories/promotion.repo.js';
import * as settingsService from './settings.service.js';
import { validateMembership } from './membership.service.js';
import { generateInvoiceNo } from '../utils/invoice.js';
import type { CreateOrderInput } from '../schemas/order.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export const STATUS_SEQUENCE = ORDER_STATUSES;

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_SEQUENCE.indexOf(to) === STATUS_SEQUENCE.indexOf(from) + 1;
}

export function calculateOrderTotals(
  items: { harga: number; qty: number }[],
  discountPercent: number,
  ppnPercent: number,
  gratuityPercent: number,
  promoDiskonAmount = 0
): { subtotal: number; diskonAmount: number; promoDiskonAmount: number; gratuityAmount: number; ppnAmount: number; total: number } {
  const subtotal = items.reduce((s, i) => s + Math.floor(i.harga * i.qty), 0);
  const diskonAmount = Math.floor((subtotal * discountPercent) / 100);
  const afterDiscount = subtotal - diskonAmount - promoDiskonAmount;
  const gratuityAmount = Math.floor((afterDiscount * gratuityPercent) / 100);
  const ppnAmount = Math.floor(((afterDiscount + gratuityAmount) * ppnPercent) / 100);
  return { subtotal, diskonAmount, promoDiskonAmount, gratuityAmount, ppnAmount, total: afterDiscount + gratuityAmount + ppnAmount };
}

export async function createOrder(
  db: SqlDb,
  data: CreateOrderInput,
  userId: string,
  branchId: string
): Promise<Order> {
  const customer = await customerRepo.findById(db, data.customerId);
  if (!customer) throw makeError('Customer not found', 404);

  const branch = await branchRepo.findById(db, branchId);
  if (!branch) throw makeError('Branch not found', 404);

  const fetchedItems = await Promise.all(
    data.items.map(async (i) => {
      const item = await itemRepo.findById(db, i.itemId);
      if (!item) throw makeError(`Item ${i.itemId} not found`, 404);
      if (!item.isActive) throw makeError(`Item ${item.nama} sudah tidak aktif`, 400);
      return { ...item, qty: i.qty };
    })
  );

  const membership = await membershipRepo.findByCustomerId(db, data.customerId);
  const validation = validateMembership(membership);
  const discountPercent = validation.discountPercent;

  const itemsWithSnapshot = fetchedItems.map((item) => ({
    id: randomUUID(),
    itemId: item.id,
    namaItem: item.nama,
    tipe: item.tipe,
    harga: item.harga,
    qty: item.qty,
    subtotal: Math.floor(item.harga * item.qty),
  }));

  const appSettings = await settingsService.getSettings(db);

  let promoId: string | null = null;
  let promoDiskonAmount = 0;
  if (data.promoId) {
    const promo = await promotionRepo.findById(db, data.promoId);
    if (!promo || !promo.isActive) throw makeError('Promosi tidak valid atau tidak aktif', 400);
    const subtotalPreview = itemsWithSnapshot.reduce((s, i) => s + i.subtotal, 0);
    if (subtotalPreview < promo.minOrder) throw makeError(`Minimum order untuk promosi ini adalah ${promo.minOrder}`, 400);
    promoId = promo.id;
    promoDiskonAmount = promo.tipe === 'persen'
      ? Math.floor((subtotalPreview * promo.nilai) / 100)
      : Math.min(promo.nilai, subtotalPreview);
  }

  const totals = calculateOrderTotals(
    itemsWithSnapshot.map((i) => ({ harga: i.harga, qty: i.qty })),
    discountPercent,
    appSettings.ppnPercent,
    appSettings.gratuityPercent,
    promoDiskonAmount
  );

  const invoiceNo = await generateInvoiceNo(db, branch.kode, branchId);

  const order = await orderRepo.create(db, {
    id: randomUUID(),
    invoiceNo,
    customerId: data.customerId,
    membershipId: membership?.id ?? null,
    diskonPersen: discountPercent,
    promoId,
    ...totals,
    metodePembayaran: data.metodePembayaran,
    jumlahDibayar: data.jumlahDibayar ?? totals.total,
    catatan: data.catatan ?? null,
    branchId,
    createdBy: userId,
    items: itemsWithSnapshot,
  });

  if (membership?.tipe === 'paket_kg') {
    const kiloanQty = itemsWithSnapshot
      .filter((i) => i.tipe === 'kiloan')
      .reduce((sum, i) => sum + i.qty, 0);
    if (kiloanQty > 0) {
      await membershipRepo.deductKg(db, membership.id, kiloanQty);
    }
  }

  return order;
}

export async function updateOrderStatus(
  db: SqlDb,
  orderId: string,
  newStatus: OrderStatus,
  userId: string,
  catatan?: string
): Promise<Order> {
  const order = await orderRepo.findById(db, orderId);
  if (!order) throw makeError('Order not found', 404);

  if (!isValidTransition(order.status, newStatus)) {
    throw makeError('Transisi status tidak valid', 400);
  }

  const updated = await orderRepo.updateStatus(db, orderId, newStatus, userId, catatan);
  if (!updated) throw makeError('Order not found', 404);
  return updated;
}

export async function revertOrderStatus(
  db: SqlDb,
  orderId: string,
  userId: string,
  catatan: string
): Promise<Order> {
  const order = await orderRepo.findById(db, orderId);
  if (!order) throw makeError('Order not found', 404);

  const previousStatus = getPreviousStatus(order.status);
  if (!previousStatus) {
    throw makeError('Status sudah di awal, tidak dapat dibatalkan', 400);
  }

  const updated = await orderRepo.updateStatus(db, orderId, previousStatus, userId, catatan);
  if (!updated) throw makeError('Order not found', 404);
  return updated;
}

export async function getOrder(db: SqlDb, id: string): Promise<Order> {
  const order = await orderRepo.findById(db, id);
  if (!order) throw makeError('Order not found', 404);
  return order;
}

export async function listOrders(
  db: SqlDb,
  opts?: { customerId?: string; status?: string; branchId?: string | null; page?: number; limit?: number }
): Promise<{ data: Order[]; hasMore: boolean }> {
  return orderRepo.findAll(db, opts);
}

export async function validatePickup(
  db: SqlDb,
  token: string,
  userId: string
): Promise<Order> {
  const order = await orderRepo.findByPickupToken(db, token);
  if (!order) throw makeError('Token tidak valid', 404);
  if (order.status === 'selesai') throw makeError('Pesanan sudah selesai', 409);
  if (order.status !== 'siap_diambil') throw makeError('Pesanan belum siap diambil', 422);

  const updated = await orderRepo.updateStatus(db, order.id, 'selesai', userId);
  if (!updated) throw makeError('Order not found', 404);
  return updated;
}

export async function getOrderByPickupToken(db: SqlDb, token: string): Promise<Order> {
  const order = await orderRepo.findByPickupToken(db, token);
  if (!order) throw makeError('Token tidak valid', 404);
  return order;
}

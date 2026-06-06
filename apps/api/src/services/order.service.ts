import { randomUUID } from 'node:crypto';
import type { Order, OrderStatus } from '@laundry-palu/shared';
import { ORDER_STATUSES } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as orderRepo from '../repositories/order.repo.js';
import * as customerRepo from '../repositories/customer.repo.js';
import * as itemRepo from '../repositories/item.repo.js';
import * as membershipRepo from '../repositories/membership.repo.js';
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
  discountPercent: number
): { subtotal: number; diskonAmount: number; total: number } {
  const subtotal = items.reduce((s, i) => s + Math.floor(i.harga * i.qty), 0);
  const diskonAmount = Math.floor((subtotal * discountPercent) / 100);
  return { subtotal, diskonAmount, total: subtotal - diskonAmount };
}

export async function createOrder(
  db: SqlDb,
  data: CreateOrderInput,
  userId: string
): Promise<Order> {
  const customer = await customerRepo.findById(db, data.customerId);
  if (!customer) throw makeError('Customer not found', 404);

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

  const totals = calculateOrderTotals(
    itemsWithSnapshot.map((i) => ({ harga: i.harga, qty: i.qty })),
    discountPercent
  );

  const invoiceNo = await generateInvoiceNo(db);

  const order = await orderRepo.create(db, {
    id: randomUUID(),
    invoiceNo,
    customerId: data.customerId,
    membershipId: membership?.id ?? null,
    diskonPersen: discountPercent,
    ...totals,
    catatan: data.catatan ?? null,
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
  userId: string
): Promise<Order> {
  const order = await orderRepo.findById(db, orderId);
  if (!order) throw makeError('Order not found', 404);

  if (!isValidTransition(order.status, newStatus)) {
    throw makeError('Transisi status tidak valid', 400);
  }

  const updated = await orderRepo.updateStatus(db, orderId, newStatus, userId);
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
  opts?: { customerId?: string; status?: string }
): Promise<Order[]> {
  return orderRepo.findAll(db, opts);
}

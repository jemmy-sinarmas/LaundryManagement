import { randomUUID } from 'node:crypto';
import type { Order, OrderItem, OrderStatusHistory, OrderStatus } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type OrderRow = {
  id: string;
  invoice_no: string;
  customer_id: string;
  membership_id: string | null;
  diskon_persen: number | string;
  subtotal: number | bigint;
  diskon_amount: number | bigint;
  total: number | bigint;
  status: string;
  catatan: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  item_id: string;
  nama_item: string;
  tipe: string;
  harga: number | bigint;
  qty: number | string;
  subtotal: number | bigint;
};

type StatusHistoryRow = {
  id: string;
  order_id: string;
  status: string;
  changed_by: string | null;
  changed_at: string;
};

type CustomerPickRow = {
  id: string;
  nama: string;
  no_hp: string;
};

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    itemId: row.item_id,
    namaItem: row.nama_item,
    tipe: row.tipe as OrderItem['tipe'],
    harga: Number(row.harga),
    qty: Number(row.qty),
    subtotal: Number(row.subtotal),
  };
}

function mapStatusHistory(row: StatusHistoryRow): OrderStatusHistory {
  return {
    id: row.id,
    orderId: row.order_id,
    status: row.status as OrderStatus,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    customerId: row.customer_id,
    membershipId: row.membership_id,
    diskonPersen: Number(row.diskon_persen),
    subtotal: Number(row.subtotal),
    diskonAmount: Number(row.diskon_amount),
    total: Number(row.total),
    status: row.status as OrderStatus,
    catatan: row.catatan,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function create(
  db: SqlDb,
  data: {
    id: string;
    invoiceNo: string;
    customerId: string;
    membershipId: string | null;
    diskonPersen: number;
    subtotal: number;
    diskonAmount: number;
    total: number;
    catatan: string | null;
    createdBy: string | null;
    items: {
      id: string;
      itemId: string;
      namaItem: string;
      tipe: string;
      harga: number;
      qty: number;
      subtotal: number;
    }[];
  }
): Promise<Order> {
  const orderRows = await db<OrderRow>`
    INSERT INTO orders
      (id, invoice_no, customer_id, membership_id, diskon_persen,
       subtotal, diskon_amount, total, status, catatan, created_by)
    VALUES
      (${data.id}, ${data.invoiceNo}, ${data.customerId}, ${data.membershipId},
       ${data.diskonPersen}, ${data.subtotal}, ${data.diskonAmount}, ${data.total},
       'diterima', ${data.catatan}, ${data.createdBy})
    RETURNING *
  `;
  if (!orderRows[0]) throw new Error('Insert order failed');

  const itemRows: OrderItemRow[] = [];
  for (const item of data.items) {
    const rows = await db<OrderItemRow>`
      INSERT INTO order_items
        (id, order_id, item_id, nama_item, tipe, harga, qty, subtotal)
      VALUES
        (${item.id}, ${data.id}, ${item.itemId}, ${item.namaItem},
         ${item.tipe}, ${item.harga}, ${item.qty}, ${item.subtotal})
      RETURNING *
    `;
    if (rows[0]) itemRows.push(rows[0]);
  }

  await db`
    INSERT INTO order_status_history (id, order_id, status, changed_by)
    VALUES (${randomUUID()}, ${data.id}, 'diterima', ${data.createdBy})
  `;

  const order = mapOrder(orderRows[0]);
  order.items = itemRows.map(mapOrderItem);
  return order;
}

export async function findById(db: SqlDb, id: string): Promise<Order | null> {
  const rows = await db<OrderRow>`
    SELECT * FROM orders WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function findByInvoiceNo(db: SqlDb, invoiceNo: string): Promise<Order | null> {
  const orderRows = await db<OrderRow>`
    SELECT * FROM orders WHERE invoice_no = ${invoiceNo} LIMIT 1
  `;
  if (!orderRows[0]) return null;

  const order = mapOrder(orderRows[0]);

  const itemRows = await db<OrderItemRow>`
    SELECT * FROM order_items WHERE order_id = ${order.id} ORDER BY id
  `;
  order.items = itemRows.map(mapOrderItem);

  const historyRows = await db<StatusHistoryRow>`
    SELECT * FROM order_status_history WHERE order_id = ${order.id} ORDER BY changed_at ASC
  `;
  order.statusHistory = historyRows.map(mapStatusHistory);

  const customerRows = await db<CustomerPickRow>`
    SELECT id, nama, no_hp FROM customers WHERE id = ${order.customerId} LIMIT 1
  `;
  if (customerRows[0]) {
    order.customer = {
      id: customerRows[0].id,
      nama: customerRows[0].nama,
      noHp: customerRows[0].no_hp,
    };
  }

  return order;
}

export async function findByCustomerNoHp(db: SqlDb, noHp: string): Promise<Order[]> {
  const rows = await db<OrderRow>`
    SELECT o.* FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE c.no_hp = ${noHp}
    ORDER BY o.created_at DESC
  `;
  return rows.map(mapOrder);
}

export async function findAll(
  db: SqlDb,
  opts?: { customerId?: string; status?: string }
): Promise<Order[]> {
  if (opts?.customerId && opts?.status) {
    const rows = await db<OrderRow>`
      SELECT * FROM orders
      WHERE customer_id = ${opts.customerId} AND status = ${opts.status}
      ORDER BY created_at DESC
    `;
    return rows.map(mapOrder);
  }
  if (opts?.customerId) {
    const rows = await db<OrderRow>`
      SELECT * FROM orders WHERE customer_id = ${opts.customerId} ORDER BY created_at DESC
    `;
    return rows.map(mapOrder);
  }
  if (opts?.status) {
    const rows = await db<OrderRow>`
      SELECT * FROM orders WHERE status = ${opts.status} ORDER BY created_at DESC
    `;
    return rows.map(mapOrder);
  }
  const rows = await db<OrderRow>`SELECT * FROM orders ORDER BY created_at DESC`;
  return rows.map(mapOrder);
}

export async function updateStatus(
  db: SqlDb,
  id: string,
  status: string,
  changedBy: string | null
): Promise<Order | null> {
  const rows = await db<OrderRow>`
    UPDATE orders SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) return null;

  await db`
    INSERT INTO order_status_history (id, order_id, status, changed_by)
    VALUES (${randomUUID()}, ${id}, ${status}, ${changedBy})
  `;

  return mapOrder(rows[0]);
}

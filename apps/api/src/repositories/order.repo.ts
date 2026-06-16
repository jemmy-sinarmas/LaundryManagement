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
  ppn_amount: number | bigint;
  gratuity_amount: number | bigint;
  promo_id: string | null;
  promo_diskon_amount: number | bigint;
  total: number | bigint;
  metode_pembayaran: string;
  jumlah_dibayar: number | bigint;
  status: string;
  catatan: string | null;
  branch_id: string | null;
  pickup_token: string | null;
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
  catatan: string | null;
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
    catatan: row.catatan ?? null,
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
    promoId: row.promo_id ?? null,
    promoDiskonAmount: Number(row.promo_diskon_amount),
    gratuityAmount: Number(row.gratuity_amount),
    ppnAmount: Number(row.ppn_amount),
    total: Number(row.total),
    metodePembayaran: row.metode_pembayaran as Order['metodePembayaran'],
    jumlahDibayar: Number(row.jumlah_dibayar),
    status: row.status as OrderStatus,
    catatan: row.catatan,
    branchId: row.branch_id ?? null,
    pickupToken: row.pickup_token ?? null,
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
    promoId: string | null;
    promoDiskonAmount: number;
    gratuityAmount: number;
    ppnAmount: number;
    total: number;
    metodePembayaran: Order['metodePembayaran'];
    jumlahDibayar: number;
    catatan: string | null;
    branchId: string;
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
       subtotal, diskon_amount, promo_id, promo_diskon_amount,
       ppn_amount, gratuity_amount, total, metode_pembayaran, jumlah_dibayar,
       status, catatan, branch_id, created_by)
    VALUES
      (${data.id}, ${data.invoiceNo}, ${data.customerId}, ${data.membershipId},
       ${data.diskonPersen}, ${data.subtotal}, ${data.diskonAmount},
       ${data.promoId}, ${data.promoDiskonAmount},
       ${data.ppnAmount}, ${data.gratuityAmount}, ${data.total},
       ${data.metodePembayaran}, ${data.jumlahDibayar},
       'diterima', ${data.catatan}, ${data.branchId}, ${data.createdBy})
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
  const rows = await db<OrderRow>`SELECT * FROM orders WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return null;
  const order = mapOrder(rows[0]);

  const itemRows = await db<OrderItemRow>`SELECT * FROM order_items WHERE order_id = ${id} ORDER BY id`;
  order.items = itemRows.map(mapOrderItem);

  const customerRows = await db<CustomerPickRow>`SELECT id, nama, no_hp FROM customers WHERE id = ${order.customerId} LIMIT 1`;
  if (customerRows[0]) {
    order.customer = { id: customerRows[0].id, nama: customerRows[0].nama, noHp: customerRows[0].no_hp };
  }

  return order;
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
  opts?: { customerId?: string; status?: string; branchId?: string | null; page?: number; limit?: number }
): Promise<{ data: Order[]; hasMore: boolean }> {
  const branchId   = opts?.branchId;
  const customerId = opts?.customerId;
  const status     = opts?.status;
  const page  = Math.max(1, opts?.page  ?? 1);
  const limit = Math.min(500, Math.max(1, opts?.limit ?? 100));
  const fetch = limit + 1; // one extra to detect hasMore
  const offset = (page - 1) * limit;

  let rows: OrderRow[];

  if (branchId) {
    if (customerId && status) {
      rows = await db<OrderRow>`
        SELECT * FROM orders
        WHERE branch_id = ${branchId} AND customer_id = ${customerId} AND status = ${status}
        ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
      `;
    } else if (customerId) {
      rows = await db<OrderRow>`
        SELECT * FROM orders WHERE branch_id = ${branchId} AND customer_id = ${customerId}
        ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
      `;
    } else if (status) {
      rows = await db<OrderRow>`
        SELECT * FROM orders WHERE branch_id = ${branchId} AND status = ${status}
        ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
      `;
    } else {
      rows = await db<OrderRow>`
        SELECT * FROM orders WHERE branch_id = ${branchId}
        ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
      `;
    }
  } else if (customerId && status) {
    rows = await db<OrderRow>`
      SELECT * FROM orders WHERE customer_id = ${customerId} AND status = ${status}
      ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
    `;
  } else if (customerId) {
    rows = await db<OrderRow>`
      SELECT * FROM orders WHERE customer_id = ${customerId}
      ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
    `;
  } else if (status) {
    rows = await db<OrderRow>`
      SELECT * FROM orders WHERE status = ${status}
      ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
    `;
  } else {
    rows = await db<OrderRow>`
      SELECT * FROM orders ORDER BY created_at DESC LIMIT ${fetch} OFFSET ${offset}
    `;
  }

  const hasMore = rows.length > limit;
  return { data: rows.slice(0, limit).map(mapOrder), hasMore };
}

export async function findByPickupToken(db: SqlDb, token: string): Promise<Order | null> {
  const rows = await db<OrderRow>`
    SELECT * FROM orders WHERE pickup_token = ${token} LIMIT 1
  `;
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function updateStatus(
  db: SqlDb,
  id: string,
  status: string,
  changedBy: string | null,
  catatan?: string | null
): Promise<Order | null> {
  const rows = await db<OrderRow>`
    UPDATE orders SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) return null;

  await db`
    INSERT INTO order_status_history (id, order_id, status, changed_by, catatan)
    VALUES (${randomUUID()}, ${id}, ${status}, ${changedBy}, ${catatan ?? null})
  `;

  return mapOrder(rows[0]);
}

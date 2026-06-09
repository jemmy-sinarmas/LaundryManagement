import type { SqlDb } from '../lib/db-types.js';

// ---- Row types ----

type RevenueRow = {
  revenue_today: number | bigint;
  revenue_this_week: number | bigint;
  revenue_this_month: number | bigint;
};

type StatusCountRow = { status: string; count: string };

type TopCustomerRow = {
  customer_id: string;
  nama: string;
  total_revenue: number | bigint;
  order_count: string;
};

type DailyOrderRow = {
  invoice_no: string;
  customer_nama: string;
  total: number | bigint;
  status: string;
};

type SumRow = { total: number | bigint };

type RevenueByDayRow = { date: string; revenue: number | bigint };

type RevenueByTypeRow = { tipe: string; total_revenue: number | bigint };

type CustomerTypeRow = { customer_type: string };

type ExpenseLevelRow = { level: string; total: number | bigint };

type InventorySnapshotRow = {
  id: string;
  nama: string;
  satuan: string;
  qty_saat_ini: number | string;
  harga_rata_fifo: number | bigint;
  stok_minimum: number | string;
  is_active: boolean | number;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
};

// ---- Dashboard ----

export async function getDashboardRevenue(
  db: SqlDb,
  today: string,
  branchId?: string | null
): Promise<{ revenueToday: number; revenueThisWeek: number; revenueThisMonth: number }> {
  const rows = branchId
    ? await db<RevenueRow>`
        SELECT
          COALESCE(SUM(CASE WHEN DATE(created_at AT TIME ZONE 'UTC') = ${today}::date THEN total ELSE 0 END), 0) AS revenue_today,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('week', NOW()) THEN total ELSE 0 END), 0)             AS revenue_this_week,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN total ELSE 0 END), 0)            AS revenue_this_month
        FROM orders
        WHERE status = 'selesai' AND branch_id = ${branchId}
      `
    : await db<RevenueRow>`
        SELECT
          COALESCE(SUM(CASE WHEN DATE(created_at AT TIME ZONE 'UTC') = ${today}::date THEN total ELSE 0 END), 0) AS revenue_today,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('week', NOW()) THEN total ELSE 0 END), 0)             AS revenue_this_week,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN total ELSE 0 END), 0)            AS revenue_this_month
        FROM orders
        WHERE status = 'selesai'
      `;
  const row = rows[0];
  return {
    revenueToday: Number(row?.revenue_today ?? 0),
    revenueThisWeek: Number(row?.revenue_this_week ?? 0),
    revenueThisMonth: Number(row?.revenue_this_month ?? 0),
  };
}

export async function getOrdersByStatus(
  db: SqlDb,
  branchId?: string | null
): Promise<{ status: string; count: number }[]> {
  const rows = branchId
    ? await db<StatusCountRow>`
        SELECT status, COUNT(*)::text AS count
        FROM orders
        WHERE status != 'selesai' AND branch_id = ${branchId}
        GROUP BY status ORDER BY status
      `
    : await db<StatusCountRow>`
        SELECT status, COUNT(*)::text AS count
        FROM orders
        WHERE status != 'selesai'
        GROUP BY status ORDER BY status
      `;
  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}

export async function getTop5Customers(
  db: SqlDb,
  fromDate: string,
  branchId?: string | null
): Promise<{ customerId: string; nama: string; totalRevenue: number; orderCount: number }[]> {
  const rows = branchId
    ? await db<TopCustomerRow>`
        SELECT o.customer_id, c.nama, SUM(o.total) AS total_revenue, COUNT(o.id)::text AS order_count
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.status = 'selesai' AND o.created_at >= ${fromDate}::date AND o.branch_id = ${branchId}
        GROUP BY o.customer_id, c.nama
        ORDER BY total_revenue DESC
        LIMIT 5
      `
    : await db<TopCustomerRow>`
        SELECT o.customer_id, c.nama, SUM(o.total) AS total_revenue, COUNT(o.id)::text AS order_count
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.status = 'selesai' AND o.created_at >= ${fromDate}::date
        GROUP BY o.customer_id, c.nama
        ORDER BY total_revenue DESC
        LIMIT 5
      `;
  return rows.map((r) => ({
    customerId: r.customer_id,
    nama: r.nama,
    totalRevenue: Number(r.total_revenue),
    orderCount: Number(r.order_count),
  }));
}

// ---- Daily ----

export async function getDailyOrders(
  db: SqlDb,
  date: string,
  branchId?: string | null
): Promise<{ invoiceNo: string; customerNama: string; total: number; status: string }[]> {
  const rows = branchId
    ? await db<DailyOrderRow>`
        SELECT o.invoice_no, c.nama AS customer_nama, o.total, o.status
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE DATE(o.created_at AT TIME ZONE 'UTC') = ${date}::date AND o.status = 'selesai' AND o.branch_id = ${branchId}
        ORDER BY o.created_at
      `
    : await db<DailyOrderRow>`
        SELECT o.invoice_no, c.nama AS customer_nama, o.total, o.status
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE DATE(o.created_at AT TIME ZONE 'UTC') = ${date}::date AND o.status = 'selesai'
        ORDER BY o.created_at
      `;
  return rows.map((r) => ({
    invoiceNo: r.invoice_no,
    customerNama: r.customer_nama,
    total: Number(r.total),
    status: r.status,
  }));
}

export async function getDailyRevenue(db: SqlDb, date: string, branchId?: string | null): Promise<number> {
  const rows = branchId
    ? await db<SumRow>`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM orders
        WHERE DATE(created_at AT TIME ZONE 'UTC') = ${date}::date AND status = 'selesai' AND branch_id = ${branchId}
      `
    : await db<SumRow>`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM orders
        WHERE DATE(created_at AT TIME ZONE 'UTC') = ${date}::date AND status = 'selesai'
      `;
  return Number(rows[0]?.total ?? 0);
}

export async function getDailyExpenses(db: SqlDb, date: string, branchId?: string | null): Promise<number> {
  const rows = branchId
    ? await db<SumRow>`
        SELECT COALESCE(SUM(jumlah), 0) AS total
        FROM expenses
        WHERE tanggal = ${date}::date AND branch_id = ${branchId}
      `
    : await db<SumRow>`
        SELECT COALESCE(SUM(jumlah), 0) AS total
        FROM expenses
        WHERE tanggal = ${date}::date
      `;
  return Number(rows[0]?.total ?? 0);
}

// ---- Monthly ----

export async function getMonthlyRevenueByDay(
  db: SqlDb,
  year: number,
  month: number,
  branchId?: string | null
): Promise<{ date: string; revenue: number }[]> {
  const rows = branchId
    ? await db<RevenueByDayRow>`
        SELECT DATE(created_at AT TIME ZONE 'UTC')::text AS date, COALESCE(SUM(total), 0) AS revenue
        FROM orders
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
          AND EXTRACT(MONTH FROM created_at) = ${month}
          AND status = 'selesai' AND branch_id = ${branchId}
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY date
      `
    : await db<RevenueByDayRow>`
        SELECT DATE(created_at AT TIME ZONE 'UTC')::text AS date, COALESCE(SUM(total), 0) AS revenue
        FROM orders
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
          AND EXTRACT(MONTH FROM created_at) = ${month}
          AND status = 'selesai'
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY date
      `;
  return rows.map((r) => ({ date: r.date, revenue: Number(r.revenue) }));
}

export async function getMonthlyRevenueByItemType(
  db: SqlDb,
  year: number,
  month: number,
  branchId?: string | null
): Promise<{ tipe: string; totalRevenue: number }[]> {
  const rows = branchId
    ? await db<RevenueByTypeRow>`
        SELECT oi.tipe, COALESCE(SUM(oi.subtotal), 0) AS total_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
          AND EXTRACT(MONTH FROM o.created_at) = ${month}
          AND o.status = 'selesai' AND o.branch_id = ${branchId}
        GROUP BY oi.tipe
      `
    : await db<RevenueByTypeRow>`
        SELECT oi.tipe, COALESCE(SUM(oi.subtotal), 0) AS total_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
          AND EXTRACT(MONTH FROM o.created_at) = ${month}
          AND o.status = 'selesai'
        GROUP BY oi.tipe
      `;
  return rows.map((r) => ({ tipe: r.tipe, totalRevenue: Number(r.total_revenue) }));
}

export async function getMonthlyCustomerTypes(
  db: SqlDb,
  year: number,
  month: number,
  branchId?: string | null
): Promise<{ customer_type: string }[]> {
  if (branchId) {
    return db<CustomerTypeRow>`
      SELECT
        customer_id,
        CASE WHEN EXISTS (
          SELECT 1 FROM orders o2
          WHERE o2.customer_id = o.customer_id
            AND o2.created_at < MAKE_DATE(${year}::int, ${month}::int, 1)::timestamp
            AND o2.branch_id = ${branchId}
        ) THEN 'returning' ELSE 'new' END AS customer_type
      FROM (
        SELECT DISTINCT customer_id FROM orders
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
          AND EXTRACT(MONTH FROM created_at) = ${month}
          AND branch_id = ${branchId}
      ) o
    `;
  }
  return db<CustomerTypeRow>`
    SELECT
      customer_id,
      CASE WHEN EXISTS (
        SELECT 1 FROM orders o2
        WHERE o2.customer_id = o.customer_id
          AND o2.created_at < MAKE_DATE(${year}::int, ${month}::int, 1)::timestamp
      ) THEN 'returning' ELSE 'new' END AS customer_type
    FROM (
      SELECT DISTINCT customer_id FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = ${year}
        AND EXTRACT(MONTH FROM created_at) = ${month}
    ) o
  `;
}

// ---- Income statement ----

export async function getRevenueInRange(
  db: SqlDb,
  from: string,
  to: string,
  branchId?: string | null
): Promise<number> {
  const rows = branchId
    ? await db<SumRow>`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM orders
        WHERE DATE(created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
          AND status = 'selesai' AND branch_id = ${branchId}
      `
    : await db<SumRow>`
        SELECT COALESCE(SUM(total), 0) AS total
        FROM orders
        WHERE DATE(created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
          AND status = 'selesai'
      `;
  return Number(rows[0]?.total ?? 0);
}

export async function getExpensesByLevelInRange(
  db: SqlDb,
  from: string,
  to: string,
  branchId?: string | null
): Promise<{ level: string; total: number }[]> {
  const rows = branchId
    ? await db<ExpenseLevelRow>`
        SELECT ec.level, COALESCE(SUM(e.jumlah), 0) AS total
        FROM expenses e
        JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.tanggal BETWEEN ${from}::date AND ${to}::date AND e.branch_id = ${branchId}
        GROUP BY ec.level
      `
    : await db<ExpenseLevelRow>`
        SELECT ec.level, COALESCE(SUM(e.jumlah), 0) AS total
        FROM expenses e
        JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.tanggal BETWEEN ${from}::date AND ${to}::date
        GROUP BY ec.level
      `;
  return rows.map((r) => ({ level: r.level, total: Number(r.total) }));
}

// ---- Sales ----

type SalesItemRow = {
  nama_item: string;
  tipe: string;
  revenue: number | bigint;
  qty: number | bigint;
};

type SalesTotalsRow = {
  total_revenue: number | bigint;
  order_count: string;
};

export async function getSalesInRange(
  db: SqlDb,
  from: string,
  to: string,
  branchId?: string | null
): Promise<{
  totalRevenue: number;
  totalOrders: number;
  byItem: { namaItem: string; tipe: string; revenue: number; qty: number }[];
}> {
  const itemRows = branchId
    ? await db<SalesItemRow>`
        SELECT oi.nama_item, oi.tipe,
               COALESCE(SUM(oi.subtotal), 0) AS revenue,
               COALESCE(SUM(oi.qty), 0) AS qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'selesai'
          AND DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
          AND o.branch_id = ${branchId}
        GROUP BY oi.nama_item, oi.tipe
        ORDER BY revenue DESC
      `
    : await db<SalesItemRow>`
        SELECT oi.nama_item, oi.tipe,
               COALESCE(SUM(oi.subtotal), 0) AS revenue,
               COALESCE(SUM(oi.qty), 0) AS qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'selesai'
          AND DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        GROUP BY oi.nama_item, oi.tipe
        ORDER BY revenue DESC
      `;

  const totalsRows = branchId
    ? await db<SalesTotalsRow>`
        SELECT COALESCE(SUM(total), 0) AS total_revenue, COUNT(*)::text AS order_count
        FROM orders
        WHERE status = 'selesai'
          AND DATE(created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
          AND branch_id = ${branchId}
      `
    : await db<SalesTotalsRow>`
        SELECT COALESCE(SUM(total), 0) AS total_revenue, COUNT(*)::text AS order_count
        FROM orders
        WHERE status = 'selesai'
          AND DATE(created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
      `;

  return {
    totalRevenue: Number(totalsRows[0]?.total_revenue ?? 0),
    totalOrders: Number(totalsRows[0]?.order_count ?? 0),
    byItem: itemRows.map((r) => ({
      namaItem: r.nama_item,
      tipe: r.tipe,
      revenue: Number(r.revenue),
      qty: Number(r.qty),
    })),
  };
}

// ---- Transactions ----

type TransactionRow = {
  id: string;
  invoice_no: string;
  customer_nama: string;
  branch_id: string | null;
  status: string;
  total: number | bigint;
  created_at: string;
};

export async function getTransactionsInRange(
  db: SqlDb,
  from: string,
  to: string,
  branchId?: string | null,
  status?: string | null
): Promise<{ id: string; invoiceNo: string; customerNama: string; branchId: string | null; status: string; total: number; createdAt: string }[]> {
  let rows: TransactionRow[];
  if (branchId && status) {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        AND o.branch_id = ${branchId} AND o.status = ${status}
      ORDER BY o.created_at DESC
    `;
  } else if (branchId) {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        AND o.branch_id = ${branchId}
      ORDER BY o.created_at DESC
    `;
  } else if (status) {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        AND o.status = ${status}
      ORDER BY o.created_at DESC
    `;
  } else {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
      ORDER BY o.created_at DESC
    `;
  }
  return rows.map((r) => ({
    id: r.id,
    invoiceNo: r.invoice_no,
    customerNama: r.customer_nama,
    branchId: r.branch_id ?? null,
    status: r.status,
    total: Number(r.total),
    createdAt: r.created_at,
  }));
}

// ---- Invoices ----

export async function getInvoicesInRange(
  db: SqlDb,
  from: string,
  to: string,
  branchId?: string | null,
  q?: string | null
): Promise<{ id: string; invoiceNo: string; customerNama: string; branchId: string | null; status: string; total: number; createdAt: string }[]> {
  const search = q ? `%${q}%` : null;
  let rows: TransactionRow[];
  if (branchId && search) {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        AND o.branch_id = ${branchId}
        AND (o.invoice_no ILIKE ${search} OR c.nama ILIKE ${search})
      ORDER BY o.created_at DESC
    `;
  } else if (branchId) {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        AND o.branch_id = ${branchId}
      ORDER BY o.created_at DESC
    `;
  } else if (search) {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        AND (o.invoice_no ILIKE ${search} OR c.nama ILIKE ${search})
      ORDER BY o.created_at DESC
    `;
  } else {
    rows = await db<TransactionRow>`
      SELECT o.id, o.invoice_no, c.nama AS customer_nama, o.branch_id, o.status, o.total, o.created_at
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE DATE(o.created_at AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
      ORDER BY o.created_at DESC
    `;
  }
  return rows.map((r) => ({
    id: r.id,
    invoiceNo: r.invoice_no,
    customerNama: r.customer_nama,
    branchId: r.branch_id ?? null,
    status: r.status,
    total: Number(r.total),
    createdAt: r.created_at,
  }));
}

// ---- Shifts report ----

type ShiftReportRow = {
  id: string;
  kasir_nama: string;
  kasir_username: string;
  branch_nama: string;
  start_time: string;
  end_time: string | null;
  start_cash: number | bigint;
  end_cash: number | bigint | null;
  notes: string | null;
  order_count: string;
};

export async function getShiftsInRange(
  db: SqlDb,
  from: string,
  to: string,
  branchId?: string | null
): Promise<{
  id: string;
  kasirNama: string;
  kasirUsername: string;
  branchNama: string;
  startTime: string;
  endTime: string | null;
  startCash: number;
  endCash: number | null;
  notes: string | null;
  orderCount: number;
}[]> {
  const rows = branchId
    ? await db<ShiftReportRow>`
        SELECT s.id, u.nama AS kasir_nama, u.username AS kasir_username, b.nama AS branch_nama,
               s.start_time, s.end_time, s.start_cash, s.end_cash, s.notes,
               (SELECT COUNT(*)::text FROM orders o
                WHERE o.created_by = s.kasir_id
                  AND o.created_at >= s.start_time
                  AND o.created_at < COALESCE(s.end_time, NOW())) AS order_count
        FROM shifts s
        JOIN users    u ON u.id = s.kasir_id
        JOIN branches b ON b.id = s.branch_id
        WHERE DATE(s.start_time AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
          AND s.branch_id = ${branchId}
        ORDER BY s.start_time DESC
      `
    : await db<ShiftReportRow>`
        SELECT s.id, u.nama AS kasir_nama, u.username AS kasir_username, b.nama AS branch_nama,
               s.start_time, s.end_time, s.start_cash, s.end_cash, s.notes,
               (SELECT COUNT(*)::text FROM orders o
                WHERE o.created_by = s.kasir_id
                  AND o.created_at >= s.start_time
                  AND o.created_at < COALESCE(s.end_time, NOW())) AS order_count
        FROM shifts s
        JOIN users    u ON u.id = s.kasir_id
        JOIN branches b ON b.id = s.branch_id
        WHERE DATE(s.start_time AT TIME ZONE 'UTC') BETWEEN ${from}::date AND ${to}::date
        ORDER BY s.start_time DESC
      `;
  return rows.map((r) => ({
    id: r.id,
    kasirNama: r.kasir_nama,
    kasirUsername: r.kasir_username,
    branchNama: r.branch_nama,
    startTime: r.start_time,
    endTime: r.end_time ?? null,
    startCash: Number(r.start_cash),
    endCash: r.end_cash !== null && r.end_cash !== undefined ? Number(r.end_cash) : null,
    notes: r.notes ?? null,
    orderCount: Number(r.order_count),
  }));
}

// ---- Inventory snapshot ----

export async function getInventorySnapshot(
  db: SqlDb
): Promise<{
  id: string;
  nama: string;
  satuan: string;
  qtySaatIni: number;
  hargaRataFifo: number;
  stokMinimum: number;
  isActive: boolean;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}[]> {
  const rows = await db<InventorySnapshotRow>`
    SELECT * FROM inventory_items WHERE is_active = true ORDER BY nama
  `;
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    satuan: r.satuan,
    qtySaatIni: Number(r.qty_saat_ini),
    hargaRataFifo: Number(r.harga_rata_fifo),
    stokMinimum: Number(r.stok_minimum),
    isActive: Boolean(r.is_active),
    branchId: r.branch_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

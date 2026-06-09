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

import type { Customer } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type CustomerRow = {
  id: string;
  nama: string;
  alamat: string | null;
  no_hp: string;
  country_code: string;
  created_at: string;
  updated_at: string;
};

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    nama: row.nama,
    alamat: row.alamat,
    noHp: row.no_hp,
    countryCode: row.country_code ?? '+62',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function count(db: SqlDb, search?: string): Promise<number> {
  if (search) {
    const pattern = `%${search}%`;
    const rows = await db<{ n: string }>`
      SELECT COUNT(*) AS n FROM customers
      WHERE no_hp ILIKE ${pattern} OR nama ILIKE ${pattern}
    `;
    return Number(rows[0]?.n ?? 0);
  }
  const rows = await db<{ n: string }>`SELECT COUNT(*) AS n FROM customers`;
  return Number(rows[0]?.n ?? 0);
}

export async function findAll(
  db: SqlDb,
  opts?: { search?: string; page?: number; limit?: number }
): Promise<Customer[]> {
  const page  = Math.max(1, opts?.page  ?? 1);
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
  const offset = (page - 1) * limit;

  if (opts?.search) {
    const pattern = `%${opts.search}%`;
    const rows = await db<CustomerRow>`
      SELECT * FROM customers
      WHERE no_hp ILIKE ${pattern} OR nama ILIKE ${pattern}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows.map(mapCustomer);
  }
  const rows = await db<CustomerRow>`
    SELECT * FROM customers ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map(mapCustomer);
}

export async function findById(db: SqlDb, id: string): Promise<Customer | null> {
  const rows = await db<CustomerRow>`
    SELECT * FROM customers WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapCustomer(rows[0]) : null;
}

export async function findByNoHp(db: SqlDb, noHp: string): Promise<Customer | null> {
  const rows = await db<CustomerRow>`
    SELECT * FROM customers WHERE no_hp = ${noHp} LIMIT 1
  `;
  return rows[0] ? mapCustomer(rows[0]) : null;
}

export async function create(
  db: SqlDb,
  data: { id: string; nama: string; alamat?: string | null; noHp: string; countryCode?: string }
): Promise<Customer> {
  const countryCode = data.countryCode ?? '+62';
  const rows = await db<CustomerRow>`
    INSERT INTO customers (id, nama, alamat, no_hp, country_code)
    VALUES (${data.id}, ${data.nama}, ${data.alamat ?? null}, ${data.noHp}, ${countryCode})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapCustomer(rows[0]);
}

export async function update(
  db: SqlDb,
  id: string,
  data: { nama?: string | undefined; alamat?: string | null | undefined; noHp?: string | undefined; countryCode?: string | undefined }
): Promise<Customer | null> {
  const existing = await findById(db, id);
  if (!existing) return null;

  const nama = data.nama ?? existing.nama;
  const alamat = data.alamat !== undefined ? data.alamat : existing.alamat;
  const noHp = data.noHp ?? existing.noHp;
  const countryCode = data.countryCode ?? existing.countryCode;

  const rows = await db<CustomerRow>`
    UPDATE customers
    SET nama = ${nama}, alamat = ${alamat}, no_hp = ${noHp}, country_code = ${countryCode}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapCustomer(rows[0]) : null;
}

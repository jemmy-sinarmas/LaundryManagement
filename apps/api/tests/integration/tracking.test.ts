import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { getApp, closeApp } from './helpers/app.js';
import { truncateAll } from './helpers/db.js';
import { seedBaseData, getKasirToken, TEST_BRANCH_ID } from './helpers/seed.js';

let app: FastifyInstance;
let kasirToken: string;
let order: { id: string; invoiceNo: string; pickupToken: string | null };

beforeAll(async () => {
  app = await getApp();
  await seedBaseData(app);
  kasirToken = await getKasirToken(app);
});

afterAll(async () => {
  await closeApp();
});

beforeEach(async () => {
  await truncateAll(app);
  await seedBaseData(app);

  const custRes = await app.inject({
    method: 'POST',
    url: '/api/v1/customers',
    headers: { cookie: `token=${kasirToken}` },
    payload: { nama: 'Track Customer', noHp: '081777000001' },
  });
  const customerId = custRes.json<{ id: string }>().id;

  const itemId = randomUUID();
  await app.db.unsafe(`
    INSERT INTO items (id, nama, tipe, harga, branch_id)
    VALUES ('${itemId}', 'Cuci Kiloan Track', 'kiloan', 7000, '${TEST_BRANCH_ID}')
  `);

  const orderRes = await app.inject({
    method: 'POST',
    url: '/api/v1/orders',
    headers: { cookie: `token=${kasirToken}` },
    payload: { customerId, metodePembayaran: 'tunai', items: [{ itemId, qty: 3 }] },
  });
  order = orderRes.json<{ id: string; invoiceNo: string; pickupToken: string | null }>();
});

describe('GET /api/v1/track/:invoiceNo (public)', () => {
  it('returns the order without authentication', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/track/${order.invoiceNo}` });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ invoiceNo: string }>().invoiceNo).toBe(order.invoiceNo);
  });

  it('returns 404 for an unknown invoice number', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/track/INV-TST-99999999-9999' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/track/t/:token (public, opaque token)', () => {
  it('returns the order for a valid pickup token', async () => {
    expect(order.pickupToken).toBeTruthy();
    const res = await app.inject({ method: 'GET', url: `/api/v1/track/t/${order.pickupToken}` });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ id: string }>().id).toBe(order.id);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/track/t/${randomUUID()}`,
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/track/phone/:noHp (public)', () => {
  it('returns the customer orders for a known phone number', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/track/phone/081777000001' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ invoiceNo: string }[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]?.invoiceNo).toBe(order.invoiceNo);
  });

  it('returns an empty array for an unknown phone number', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/track/phone/080000000000' });
    expect(res.statusCode).toBe(200);
    expect(res.json<unknown[]>()).toEqual([]);
  });
});

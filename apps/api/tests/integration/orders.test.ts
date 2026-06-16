import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { getApp, closeApp } from './helpers/app.js';
import { truncateAll } from './helpers/db.js';
import { seedBaseData, getKasirToken, TEST_BRANCH_ID } from './helpers/seed.js';

let app: FastifyInstance;
let kasirToken: string;
let customerId: string;
let itemId: string;

beforeAll(async () => {
  app = await getApp();
  // Login once — JWT is stateless, token survives table truncation
  await seedBaseData(app);
  kasirToken = await getKasirToken(app);
});

afterAll(async () => {
  await closeApp();
});

beforeEach(async () => {
  await truncateAll(app);
  await seedBaseData(app); // re-seed users/branch/settings; no re-login needed

  // Seed a customer via the API
  const custRes = await app.inject({
    method: 'POST',
    url: '/api/v1/customers',
    headers: { cookie: `token=${kasirToken}` },
    payload: { nama: 'Test Customer', noHp: '081999000001' },
  });
  customerId = custRes.json<{ id: string }>().id;

  // Seed an item directly — 'kiloan' type, Rp 7.000/kg
  itemId = randomUUID();
  await app.db.unsafe(`
    INSERT INTO items (id, nama, tipe, harga, branch_id)
    VALUES ('${itemId}', 'Cuci Kiloan Test', 'kiloan', 7000, '${TEST_BRANCH_ID}')
  `);
});

function orderPayload(qty = 5) {
  return {
    customerId,
    metodePembayaran: 'tunai',
    items: [{ itemId, qty }],
  };
}

describe('POST /api/v1/orders', () => {
  it('creates an order with correct status and total', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: `token=${kasirToken}` },
      payload: orderPayload(5),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; invoiceNo: string; status: string; total: number; items: unknown[] }>();
    expect(body.status).toBe('diterima');
    expect(body.total).toBe(35000); // 5kg × Rp7.000, no ppn/gratuity
    expect(body.items).toHaveLength(1);
    expect(body.invoiceNo).toMatch(/^INV-TST-\d{8}-\d{4}$/);
  });

  it('returns 404 when customer does not exist', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: `token=${kasirToken}` },
      payload: { customerId: '00000000-0000-0000-0000-000000000000', metodePembayaran: 'tunai', items: [{ itemId, qty: 1 }] },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when items array is empty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: `token=${kasirToken}` },
      payload: { customerId, items: [] },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/orders', () => {
  it('returns { data, hasMore } shape', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: `token=${kasirToken}` },
      payload: orderPayload(),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/orders',
      headers: { cookie: `token=${kasirToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[]; hasMore: boolean }>();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.hasMore).toBe(false);
  });
});

describe('PATCH /api/v1/orders/:id/status', () => {
  async function createOrder() {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: `token=${kasirToken}` },
      payload: orderPayload(),
    });
    return res.json<{ id: string }>().id;
  }

  it('advances status from diterima to dicuci', async () => {
    const id = await createOrder();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/orders/${id}/status`,
      headers: { cookie: `token=${kasirToken}` },
      payload: { status: 'dicuci' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ status: string }>().status).toBe('dicuci');
  });

  it('returns 400 for invalid transition (skip a step)', async () => {
    const id = await createOrder();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/orders/${id}/status`,
      headers: { cookie: `token=${kasirToken}` },
      payload: { status: 'selesai' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for non-existent order', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/orders/00000000-0000-0000-0000-000000000000/status',
      headers: { cookie: `token=${kasirToken}` },
      payload: { status: 'dicuci' },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/orders/:id', () => {
  it('returns the full order by id', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: `token=${kasirToken}` },
      payload: orderPayload(),
    });
    const { id } = createRes.json<{ id: string }>();

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/orders/${id}`,
      headers: { cookie: `token=${kasirToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ id: string }>().id).toBe(id);
  });
});

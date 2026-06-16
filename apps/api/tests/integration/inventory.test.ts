import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getApp, closeApp } from './helpers/app.js';
import { truncateAll } from './helpers/db.js';
import { seedBaseData, getAdminToken, getKasirToken, TEST_BRANCH_ID } from './helpers/seed.js';

let app: FastifyInstance;
let adminToken: string;
let kasirToken: string;

beforeAll(async () => {
  app = await getApp();
  await seedBaseData(app);
  [adminToken, kasirToken] = await Promise.all([getAdminToken(app), getKasirToken(app)]);
});

afterAll(async () => {
  await closeApp();
});

beforeEach(async () => {
  await truncateAll(app);
  await seedBaseData(app);
});

const validItem = {
  nama: 'Deterjen Cair',
  satuan: 'liter',
  stokMinimum: 5,
  branchId: TEST_BRANCH_ID,
};

async function createItem(token: string) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/inventory',
    headers: { cookie: `token=${token}` },
    payload: validItem,
  });
}

describe('POST /api/v1/inventory', () => {
  it('creates an inventory item as admin and returns 201', async () => {
    const res = await createItem(adminToken);
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; nama: string; satuan: string }>();
    expect(body.nama).toBe('Deterjen Cair');
    expect(body.satuan).toBe('liter');
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns 403 when a kasir tries to create', async () => {
    const res = await createItem(kasirToken);
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when stokMinimum is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory',
      headers: { cookie: `token=${adminToken}` },
      payload: { nama: 'X', satuan: 'pcs', branchId: TEST_BRANCH_ID },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/inventory', payload: validItem });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/inventory', () => {
  it('returns the list of items for an authenticated user', async () => {
    await createItem(adminToken);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory',
      headers: { cookie: `token=${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ nama: string }[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]?.nama).toBe('Deterjen Cair');
  });
});

describe('POST /api/v1/inventory/:id/purchase', () => {
  it('records a purchase that increases stock (admin)', async () => {
    const { id } = (await createItem(adminToken)).json<{ id: string }>();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/inventory/${id}/purchase`,
      headers: { cookie: `token=${adminToken}` },
      payload: { qty: 10, hargaPerUnit: 25000 },
    });
    expect(res.statusCode).toBeLessThan(300);

    const after = await app.inject({
      method: 'GET',
      url: `/api/v1/inventory/${id}`,
      headers: { cookie: `token=${adminToken}` },
    });
    expect(after.statusCode).toBe(200);
    expect(after.json<{ qtySaatIni: number }>().qtySaatIni).toBe(10);
  });
});

describe('GET /api/v1/inventory/:id', () => {
  it('returns 404 for an unknown id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/00000000-0000-0000-0000-000000000000',
      headers: { cookie: `token=${adminToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getApp, closeApp } from './helpers/app.js';
import { truncateAll } from './helpers/db.js';
import { seedBaseData, getAdminToken, getKasirToken } from './helpers/seed.js';

let app: FastifyInstance;
let adminToken: string;
let kasirToken: string;

beforeAll(async () => {
  app = await getApp();
  // Login once — JWT is stateless (no DB check), tokens survive table truncation
  await seedBaseData(app);
  [adminToken, kasirToken] = await Promise.all([getAdminToken(app), getKasirToken(app)]);
});

afterAll(async () => {
  await closeApp();
});

beforeEach(async () => {
  await truncateAll(app);
  await seedBaseData(app); // re-seed users/branch/settings; no re-login needed
});

describe('GET /api/v1/customers', () => {
  it('returns paginated shape with empty data initially', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[]; total: number; page: number; limit: number }>();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/customers' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/customers', () => {
  it('creates a customer and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
      payload: { nama: 'Budi Santoso', noHp: '081234567001' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; nama: string; noHp: string }>();
    expect(body.nama).toBe('Budi Santoso');
    expect(body.noHp).toBe('081234567001');
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns 409 when noHp already exists', async () => {
    const payload = { nama: 'Andi', noHp: '081234567999' };
    await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
      payload,
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
      payload,
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 when noHp is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
      payload: { nama: 'No Phone' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/customers — pagination', () => {
  it('paginates correctly with page and limit params', async () => {
    for (let i = 1; i <= 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/customers',
        headers: { cookie: `token=${kasirToken}` },
        payload: { nama: `Customer ${i}`, noHp: `0810000000${i}` },
      });
    }

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/customers?page=1&limit=2',
      headers: { cookie: `token=${kasirToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[]; total: number; page: number; limit: number }>();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(5);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);
  });
});

describe('GET /api/v1/customers — search', () => {
  it('filters by name', async () => {
    await Promise.all([
      app.inject({
        method: 'POST', url: '/api/v1/customers',
        headers: { cookie: `token=${kasirToken}` },
        payload: { nama: 'Rina Wulandari', noHp: '0812111' },
      }),
      app.inject({
        method: 'POST', url: '/api/v1/customers',
        headers: { cookie: `token=${kasirToken}` },
        payload: { nama: 'Budi Luhur', noHp: '0812222' },
      }),
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/customers?q=Rina',
      headers: { cookie: `token=${kasirToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: { nama: string }[]; total: number }>();
    expect(body.total).toBe(1);
    expect(body.data[0]?.nama).toBe('Rina Wulandari');
  });
});

describe('GET /api/v1/customers/:id', () => {
  it('returns 200 for existing customer', async () => {
    const created = await app.inject({
      method: 'POST', url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
      payload: { nama: 'Dewi', noHp: '0812333' },
    });
    const { id } = created.json<{ id: string }>();

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/customers/${id}`,
      headers: { cookie: `token=${kasirToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ id: string }>().id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/customers/00000000-0000-0000-0000-000000000000',
      headers: { cookie: `token=${kasirToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /api/v1/customers/:id', () => {
  it('updates name when called by admin', async () => {
    const created = await app.inject({
      method: 'POST', url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
      payload: { nama: 'Original Name', noHp: '0812444' },
    });
    const { id } = created.json<{ id: string }>();

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/customers/${id}`,
      headers: { cookie: `token=${adminToken}` },
      payload: { nama: 'Updated Name' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ nama: string }>().nama).toBe('Updated Name');
  });

  it('returns 403 when called by kasir', async () => {
    const created = await app.inject({
      method: 'POST', url: '/api/v1/customers',
      headers: { cookie: `token=${kasirToken}` },
      payload: { nama: 'Some Customer', noHp: '0812555' },
    });
    const { id } = created.json<{ id: string }>();

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/customers/${id}`,
      headers: { cookie: `token=${kasirToken}` },
      payload: { nama: 'Attempt' },
    });
    expect(res.statusCode).toBe(403);
  });
});

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

const validPromo = {
  nama: 'Diskon Pembukaan',
  tipe: 'persen' as const,
  nilai: 15,
  tanggalMulai: '2026-06-01',
  tanggalSelesai: '2026-12-31',
};

describe('POST /api/v1/promotions', () => {
  it('creates a promotion as admin and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/promotions',
      headers: { cookie: `token=${adminToken}` },
      payload: validPromo,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; nama: string; minOrder: number }>();
    expect(body.nama).toBe('Diskon Pembukaan');
    expect(body.minOrder).toBe(0); // defaulted
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns 403 when a kasir tries to create', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/promotions',
      headers: { cookie: `token=${kasirToken}` },
      payload: validPromo,
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for an invalid tipe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/promotions',
      headers: { cookie: `token=${adminToken}` },
      payload: { ...validPromo, tipe: 'gratis' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/promotions',
      payload: validPromo,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/promotions', () => {
  it('lists promotions for an admin', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/promotions',
      headers: { cookie: `token=${adminToken}` },
      payload: validPromo,
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/promotions',
      headers: { cookie: `token=${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<unknown[]>()).toHaveLength(1);
  });
});

describe('PATCH /api/v1/promotions/:id', () => {
  it('returns 404 for an unknown promotion (admin)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/promotions/00000000-0000-0000-0000-000000000000',
      headers: { cookie: `token=${adminToken}` },
      payload: { nilai: 20 },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 403 when a kasir tries to update', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/promotions/00000000-0000-0000-0000-000000000000',
      headers: { cookie: `token=${kasirToken}` },
      payload: { nilai: 20 },
    });
    expect(res.statusCode).toBe(403);
  });
});

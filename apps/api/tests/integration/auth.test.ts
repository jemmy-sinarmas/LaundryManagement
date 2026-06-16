import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getApp, closeApp } from './helpers/app.js';
import { truncateAll } from './helpers/db.js';
import { seedBaseData } from './helpers/seed.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await getApp();
});

afterAll(async () => {
  await closeApp();
});

beforeEach(async () => {
  await truncateAll(app);
  await seedBaseData(app);
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with user and sets an httpOnly token cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin_test', password: 'admin123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ user: { username: string; role: string } }>();
    expect(body.user.username).toBe('admin_test');
    expect(body.user.role).toBe('admin');

    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookieStr).toMatch(/token=/);
    expect(cookieStr).toMatch(/HttpOnly/i);
  });

  it('never leaks the password hash in the response', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin_test', password: 'admin123' },
    });
    expect(res.body).not.toMatch(/password/i);
  });

  it('returns 401 for a wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin_test', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for an unknown user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'nobody', password: 'whatever' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin_test' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/v1/auth/logout', () => {
  it('returns 204 and clears the cookie when authenticated', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin_test', password: 'admin123' },
    });
    const setCookie = login.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    const token = /^token=([^;]+)/.exec(cookieStr ?? '')?.[1] ?? '';

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/auth/logout',
      headers: { cookie: `token=${token}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/v1/auth/logout' });
    expect(res.statusCode).toBe(401);
  });
});

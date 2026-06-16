import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';

// Low bcrypt cost — fast for tests, same real code path
const BCRYPT_ROUNDS = 4;

export const TEST_BRANCH_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_ADMIN_ID  = '00000000-0000-0000-0000-000000000002';
export const TEST_KASIR_ID  = '00000000-0000-0000-0000-000000000003';

export async function seedBaseData(app: FastifyInstance): Promise<void> {
  const adminHash = await bcrypt.hash('admin123', BCRYPT_ROUNDS);
  const kasirHash = await bcrypt.hash('kasir123', BCRYPT_ROUNDS);

  await app.db.unsafe(`
    INSERT INTO branches (id, nama, kode, alamat)
    VALUES ('${TEST_BRANCH_ID}', 'Cabang Test', 'TST', 'Jl. Test No. 1')
    ON CONFLICT DO NOTHING
  `);

  // admin: no branch_id (super-admin)
  await app.db.unsafe(`
    INSERT INTO users (id, nama, username, password, role)
    VALUES ('${TEST_ADMIN_ID}', 'Admin Test', 'admin_test', '${adminHash}', 'admin')
    ON CONFLICT DO NOTHING
  `);

  // kasir: bound to test branch
  await app.db.unsafe(`
    INSERT INTO users (id, nama, username, password, role, branch_id)
    VALUES ('${TEST_KASIR_ID}', 'Kasir Test', 'kasir_test', '${kasirHash}', 'kasir', '${TEST_BRANCH_ID}')
    ON CONFLICT DO NOTHING
  `);

  // order.service.ts reads these on every createOrder call
  await app.db.unsafe(`
    INSERT INTO settings (key, value) VALUES
      ('ppn_percent',       '0'),
      ('gratuity_percent',  '0'),
      ('saldo_awal_kas',    '0'),
      ('business_phone',    ''),
      ('whatsapp_enabled',  'false'),
      ('whatsapp_provider', ''),
      ('whatsapp_api_url',  ''),
      ('whatsapp_api_key',  ''),
      ('whatsapp_sender',   '')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `);
}

export async function getToken(
  app: FastifyInstance,
  username: string,
  password: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { username, password },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login failed for "${username}" (${res.statusCode}): ${res.body}`);
  }
  const setCookie = res.headers['set-cookie'];
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!cookieStr) throw new Error('No set-cookie header on login response');
  const match = /^token=([^;]+)/.exec(cookieStr);
  if (!match?.[1]) throw new Error('Cannot parse token from set-cookie header');
  return match[1];
}

export function getAdminToken(app: FastifyInstance): Promise<string> {
  return getToken(app, 'admin_test', 'admin123');
}

export function getKasirToken(app: FastifyInstance): Promise<string> {
  return getToken(app, 'kasir_test', 'kasir123');
}

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = join(__dirname, '..', '..');
const MIGRATIONS_DIR = join(API_ROOT, 'migrations');
const TEST_DB = 'laundry_palu_test';

export async function setup(): Promise<void> {
  // globalSetup runs in the main process before workers — envFile is not loaded yet
  process.loadEnvFile(join(API_ROOT, '.env.test'));

  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) throw new Error('DATABASE_URL not set — is .env.test loaded?');

  // Connect to the maintenance DB to create the test DB if it doesn't exist
  const adminUrl = dbUrl.replace(/\/[^/]+(\?.*)?$/, '/postgres');
  const adminSql = postgres(adminUrl, { max: 1 });
  try {
    const rows = await adminSql<{ datname: string }[]>`
      SELECT datname FROM pg_database WHERE datname = ${TEST_DB}
    `;
    if (rows.length === 0) {
      await adminSql.unsafe(`CREATE DATABASE ${TEST_DB}`);
      console.log(`[global-setup] Created database: ${TEST_DB}`);
    }
  } finally {
    await adminSql.end();
  }

  // Connect to the test DB and apply any pending migrations
  const testSql = postgres(dbUrl, { max: 1 });
  try {
    await testSql.unsafe(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const appliedRows = await testSql<{ filename: string }[]>`
      SELECT filename FROM schema_migrations ORDER BY filename
    `;
    const applied = new Set(appliedRows.map((r) => r.filename));

    const allFiles = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql') && f !== '002_seed.sql' && !f.includes('sqlite'))
      .sort();

    const pending = allFiles.filter((f) => !applied.has(f));
    for (const file of pending) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[global-setup] Applying: ${file}`);
      await testSql.unsafe(sql);
      await testSql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    }

    if (pending.length === 0) {
      console.log('[global-setup] All migrations already applied.');
    }
  } finally {
    await testSql.end();
  }
}

// Keep the test DB between runs for debugging — drop manually if you need a clean slate
export async function teardown(): Promise<void> {}

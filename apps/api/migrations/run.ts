import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SEED_FILE = '002_seed.sql';

async function runPostgres(databaseUrl: string, args: string[]) {
  const postgres = (await import('postgres')).default;
  const doSeed = args.includes('--seed') || args.includes('--reset');
  const doReset = args.includes('--reset');

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    if (doReset) {
      console.log('⚠️  Resetting PostgreSQL database...');
      await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      console.log('✓  Schema dropped and recreated.');
    }
    await sql.unsafe(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );
    const appliedRows = await sql<{ filename: string }[]>`
      SELECT filename FROM schema_migrations ORDER BY filename
    `;
    const applied = new Set(appliedRows.map((r) => r.filename));
    const allFiles = (await readdir(__dirname))
      .filter((f) => f.endsWith('.sql') && f !== SEED_FILE && !f.includes('sqlite'))
      .sort();
    const pending = allFiles.filter((f) => !applied.has(f));
    if (pending.length === 0) console.log('✓  No pending migrations.');
    for (const file of pending) {
      const sqlText = await readFile(join(__dirname, file), 'utf8');
      console.log(`  Applying ${file}...`);
      await sql.unsafe(sqlText);
      await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
      console.log(`  ✓  ${file} applied.`);
    }
    if (doSeed) {
      const seedSql = await readFile(join(__dirname, SEED_FILE), 'utf8');
      console.log(`  Seeding...`);
      await sql.unsafe(seedSql);
      console.log(`  ✓  Seed data inserted.`);
    }
  } finally {
    await sql.end();
  }
}

async function runPglite(databaseUrl: string, args: string[]) {
  const { PGlite } = await import('@electric-sql/pglite');
  const doSeed = args.includes('--seed') || args.includes('--reset');
  const doReset = args.includes('--reset');

  // pglite://:memory: → in-memory; pglite://./dir → file-based
  const rawPath = databaseUrl.replace(/^pglite:\/\//, '');
  const dataDir = rawPath === ':memory:' ? undefined : rawPath;

  const pg = await PGlite.create(dataDir);

  try {
    if (doReset) {
      console.log('⚠️  Resetting PGlite database (dropping all tables)...');
      await pg.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      console.log('✓  Schema dropped and recreated.');
    }

    await pg.exec(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );

    const appliedResult = await pg.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations ORDER BY filename'
    );
    const applied = new Set(appliedResult.rows.map((r) => r.filename));

    // PGlite uses the same PostgreSQL DDL — use 001_init.sql directly (not sqlite variant)
    const allFiles = (await readdir(__dirname))
      .filter(
        (f) =>
          f.endsWith('.sql') &&
          f !== SEED_FILE &&
          !f.includes('sqlite') &&
          !f.endsWith('_sqlite.sql')
      )
      .sort();

    const pending = allFiles.filter((f) => !applied.has(f));
    if (pending.length === 0) console.log('✓  No pending PGlite migrations.');

    for (const file of pending) {
      const sqlText = await readFile(join(__dirname, file), 'utf8');
      console.log(`  Applying ${file}...`);
      await pg.exec(sqlText);
      await pg.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      console.log(`  ✓  ${file} applied.`);
    }

    if (doSeed) {
      const seedSql = await readFile(join(__dirname, SEED_FILE), 'utf8');
      console.log(`  Seeding from ${SEED_FILE}...`);
      await pg.exec(seedSql);
      console.log(`  ✓  Seed data inserted.`);
    }
  } finally {
    await pg.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  if (databaseUrl.startsWith('pglite://')) {
    await runPglite(databaseUrl, args);
  } else {
    await runPostgres(databaseUrl, args);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

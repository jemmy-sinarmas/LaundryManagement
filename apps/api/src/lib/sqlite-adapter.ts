/**
 * PGlite adapter — wraps @electric-sql/pglite in the SqlDb interface.
 * Uses the same SQL syntax as PostgreSQL ($1, $2 params, same DDL).
 * DATABASE_URL format:
 *   pglite://:memory:          → in-memory (tests/CI)
 *   pglite://./pglite-data     → file-based (dev, persists across restarts)
 */
import type { SqlDb, SqlRow } from './db-types.js';

function parsePath(databaseUrl: string): string {
  const path = databaseUrl.replace(/^pglite:\/\//, '');
  return path === ':memory:' ? '' : path; // empty string = in-memory for PGlite
}

export async function createPgliteAdapter(databaseUrl: string): Promise<SqlDb> {
  const { PGlite } = await import('@electric-sql/pglite');
  const path = parsePath(databaseUrl);
  const pg = await PGlite.create(path || undefined);

  function makeAdapter(conn: InstanceType<typeof PGlite>): SqlDb {
    const adapter = async function <T extends SqlRow = SqlRow>(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Promise<T[]> {
      let query = '';
      let paramIdx = 1;
      strings.forEach((str, i) => {
        query += str;
        if (i < values.length) query += `$${paramIdx++}`;
      });
      const result = await conn.query<T>(query, values);
      return result.rows;
    } as SqlDb;

    adapter.unsafe = async (sql: string): Promise<void> => {
      await conn.exec(sql);
    };

    adapter.begin = async <T>(fn: (db: SqlDb) => Promise<T>): Promise<T> => {
      return conn.transaction(async (tx) => {
        const txAdapter = makeAdapter(tx as unknown as InstanceType<typeof PGlite>);
        return fn(txAdapter);
      }) as Promise<T>;
    };

    adapter.end = async (): Promise<void> => {
      await conn.close();
    };

    return adapter;
  }

  return makeAdapter(pg);
}

// Keep export name compatible with db.ts import
export { createPgliteAdapter as createSqliteAdapter };

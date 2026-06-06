import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import type { SqlDb } from '../lib/db-types.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: SqlDb;
  }
}

const dbPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) throw new Error('DATABASE_URL env var is not set');

  let db: SqlDb;

  if (databaseUrl.startsWith('pglite://')) {
    const { createSqliteAdapter } = await import('../lib/sqlite-adapter.js');
    db = await createSqliteAdapter(databaseUrl);
  } else {
    // postgres:// — production path
    const postgres = (await import('postgres')).default;
    const sql = postgres(databaseUrl, { max: 10, idle_timeout: 30 });
    db = sql as unknown as SqlDb;
  }

  fastify.decorate('db', db);

  fastify.addHook('onClose', async () => {
    await db.end();
  });
});

export default dbPlugin;

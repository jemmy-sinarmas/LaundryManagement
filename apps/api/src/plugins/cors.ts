import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

const corsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const origin = process.env['CORS_ORIGIN'] ?? 'http://localhost:3000';
  await fastify.register(cors, {
    origin,
    credentials: true,
  });
});

export default corsPlugin;

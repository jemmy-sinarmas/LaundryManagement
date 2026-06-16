import Fastify, { type FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { loadEnv } from './config/env.js';
import dbPlugin from './plugins/db.js';
import corsPlugin from './plugins/cors.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth/index.js';
import userRoutes from './routes/users/index.js';
import customerRoutes from './routes/customers/index.js';
import itemRoutes from './routes/items/index.js';
import membershipRoutes from './routes/membership/index.js';
import orderRoutes from './routes/orders/index.js';
import trackingRoutes from './routes/tracking/index.js';
import expenseCategoryRoutes from './routes/expense-categories/index.js';
import expenseRoutes from './routes/expenses/index.js';
import inventoryRoutes from './routes/inventory/index.js';
import reportRoutes from './routes/reports/index.js';
import settingsRoutes from './routes/settings/index.js';
import branchRoutes from './routes/branches/index.js';
import promotionRoutes from './routes/promotions/index.js';
import shiftRoutes from './routes/shifts/index.js';
import messageTemplateRoutes from './routes/message-templates/index.js';
import notificationLogRoutes from './routes/notification-log/index.js';

export interface BuildAppOptions {
  logger?: boolean;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  // Fail fast on misconfiguration (missing DB URL, weak JWT secret, etc.) before any
  // plugin or route is registered.
  loadEnv();

  const fastify = Fastify({ logger: opts.logger ?? false });

  // Centralized error handler — keeps client responses to a consistent { error } shape
  // and never leaks raw DB/stack details on unexpected failures.
  fastify.setErrorHandler((error, req, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode;

    // Schema/validation failures and explicit client errors thrown by services
    // (makeError sets statusCode) are safe to surface verbatim.
    if (error.validation) {
      return reply.code(400).send({ error: error.message });
    }
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({ error: error.message });
    }

    // Anything else is unexpected: log full detail server-side, return a generic message.
    req.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });

  await fastify.register(dbPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(authPlugin);

  await fastify.register(rateLimit, {
    global: false,
    max: 100,
    timeWindow: '1 minute',
  });

  fastify.addHook('onSend', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  });

  await fastify.register(authRoutes,            { prefix: '/api/v1/auth' });
  await fastify.register(userRoutes,            { prefix: '/api/v1/users' });
  await fastify.register(customerRoutes,        { prefix: '/api/v1/customers' });
  await fastify.register(itemRoutes,            { prefix: '/api/v1/items' });
  await fastify.register(membershipRoutes,      { prefix: '/api/v1/customers' });
  await fastify.register(orderRoutes,           { prefix: '/api/v1/orders' });
  await fastify.register(trackingRoutes,        { prefix: '/api/v1/track' });
  await fastify.register(expenseCategoryRoutes, { prefix: '/api/v1/expense-categories' });
  await fastify.register(expenseRoutes,         { prefix: '/api/v1/expenses' });
  await fastify.register(inventoryRoutes,       { prefix: '/api/v1/inventory' });
  await fastify.register(reportRoutes,          { prefix: '/api/v1/reports' });
  await fastify.register(settingsRoutes,        { prefix: '/api/v1/settings' });
  await fastify.register(branchRoutes,          { prefix: '/api/v1/branches' });
  await fastify.register(promotionRoutes,       { prefix: '/api/v1/promotions' });
  await fastify.register(shiftRoutes,           { prefix: '/api/v1/shifts' });
  await fastify.register(messageTemplateRoutes, { prefix: '/api/v1/message-templates' });
  await fastify.register(notificationLogRoutes, { prefix: '/api/v1/notification-log' });

  // Liveness: process is up and serving.
  fastify.get('/health', async () => ({ status: 'ok' }));

  // Readiness: dependencies (DB) are reachable. Used by orchestrators/healthchecks.
  fastify.get('/ready', async (_req, reply) => {
    try {
      await fastify.db`SELECT 1`;
      return { status: 'ready' };
    } catch {
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  return fastify;
}

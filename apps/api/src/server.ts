import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
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

const fastify = Fastify({ logger: true });

await fastify.register(dbPlugin);
await fastify.register(corsPlugin);
await fastify.register(authPlugin);

// Rate limiting — global:false means opt-in per route only
await fastify.register(rateLimit, {
  global: false,
  max: 100,
  timeWindow: '1 minute',
});

// Security headers on every response
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
await fastify.register(messageTemplateRoutes,  { prefix: '/api/v1/message-templates' });
await fastify.register(notificationLogRoutes, { prefix: '/api/v1/notification-log' });

fastify.get('/health', async () => ({ status: 'ok' }));

const PORT = Number(process.env['PORT'] ?? 4000);
await fastify.listen({ port: PORT, host: '0.0.0.0' });

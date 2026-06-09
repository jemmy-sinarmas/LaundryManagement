import type { FastifyPluginAsync } from 'fastify';
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  RecordPurchaseSchema,
  BulkPurchaseSchema,
} from '../../schemas/inventory.schema.js';
import * as inventoryService from '../../services/inventory.service.js';

const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/', authOnly, async (req, reply) => {
    const { include_inactive, branch_id } = req.query as { include_inactive?: string; branch_id?: string };
    const isAdmin = req.user.role === 'admin';
    const includeInactive = include_inactive === 'true' && isAdmin;
    const branchId = isAdmin ? (branch_id ?? null) : req.user.branchId;
    const items = await inventoryService.listInventoryItems(fastify.db, { includeInactive, branchId });
    reply.send(items);
  });

  fastify.post('/', adminOnly, async (req, reply) => {
    const result = CreateInventoryItemSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const item = await inventoryService.createInventoryItem(fastify.db, result.data);
      reply.code(201).send(item);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.post('/bulk-purchase', adminOnly, async (req, reply) => {
    const result = BulkPurchaseSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const transactions = await inventoryService.bulkPurchase(fastify.db, result.data, req.user.id);
      reply.code(201).send(transactions);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  // Register static /low-stock before /:id to take precedence
  fastify.get('/low-stock', authOnly, async (req, reply) => {
    const { branch_id } = req.query as { branch_id?: string };
    const isAdmin = req.user.role === 'admin';
    const branchId = isAdmin ? (branch_id ?? null) : req.user.branchId;
    const items = await inventoryService.getLowStockItems(fastify.db, branchId);
    reply.send(items);
  });

  fastify.get('/:id', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const item = await inventoryService.getInventoryItem(fastify.db, id);
      reply.send(item);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:id', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = UpdateInventoryItemSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const item = await inventoryService.updateInventoryItem(fastify.db, id, result.data);
      reply.send(item);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.post('/:id/purchase', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = RecordPurchaseSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const transaction = await inventoryService.recordPurchase(
        fastify.db,
        id,
        result.data.qty,
        result.data.hargaPerUnit,
        result.data.referensi ?? null,
        req.user.id
      );
      reply.code(201).send(transaction);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/:id/transactions', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const transactions = await inventoryService.getTransactionHistory(fastify.db, id);
    reply.send(transactions);
  });
};

export default inventoryRoutes;

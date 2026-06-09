import type { FastifyPluginAsync } from 'fastify';
import { CreateItemSchema, UpdateItemSchema } from '../../schemas/item.schema.js';
import * as itemService from '../../services/item.service.js';

const itemRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/', authOnly, async (req, reply) => {
    const { include_inactive, branch_id } = req.query as { include_inactive?: string; branch_id?: string };
    const isAdmin = req.user.role === 'admin';
    const includeInactive = include_inactive === 'true' && isAdmin;
    // Kasir: auto-filter to own branch. Admin: use query param or show all.
    const branchId = isAdmin ? (branch_id ?? null) : req.user.branchId;
    const items = await itemService.listItems(fastify.db, { includeInactive, branchId });
    reply.send(items);
  });

  fastify.post('/', adminOnly, async (req, reply) => {
    const result = CreateItemSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const item = await itemService.createItem(fastify.db, result.data);
      reply.code(201).send(item);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/:id', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const item = await itemService.getItem(fastify.db, id);
      reply.send(item);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:id', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = UpdateItemSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const item = await itemService.updateItem(fastify.db, id, result.data);
      reply.send(item);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.delete('/:id', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await itemService.deleteItem(fastify.db, id);
      reply.code(204).send();
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default itemRoutes;

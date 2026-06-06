import type { FastifyPluginAsync } from 'fastify';
import { CreateExpenseCategorySchema } from '../../schemas/expense-category.schema.js';
import * as expenseCategoryRepo from '../../repositories/expense-category.repo.js';
import { randomUUID } from 'node:crypto';

const expenseCategoryRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/', authOnly, async (_req, reply) => {
    const categories = await expenseCategoryRepo.findAll(fastify.db);
    reply.send(categories);
  });

  fastify.post('/', adminOnly, async (req, reply) => {
    const result = CreateExpenseCategorySchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const category = await expenseCategoryRepo.create(fastify.db, {
        id: randomUUID(),
        nama: result.data.nama,
        level: result.data.level,
      });
      reply.code(201).send(category);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default expenseCategoryRoutes;

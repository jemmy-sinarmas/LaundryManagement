import type { FastifyPluginAsync } from 'fastify';
import { CreatePromotionSchema, UpdatePromotionSchema } from '../../schemas/promotion.schema.js';
import * as promotionService from '../../services/promotion.service.js';

const promotionRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };

  fastify.get('/', authOnly, async (req, reply) => {
    const isAdmin = req.user.role === 'admin';
    if (isAdmin) {
      const { branch_id } = req.query as { branch_id?: string };
      const promos = await promotionService.listPromotions(fastify.db, branch_id ?? null);
      return reply.send(promos);
    }
    const branchId = req.user.branchId;
    if (!branchId) return reply.send([]);
    const promos = await promotionService.getActivePromotions(fastify.db, branchId, 0);
    return reply.send(promos);
  });

  fastify.post('/', authOnly, async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });
    const result = CreatePromotionSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const promo = await promotionService.createPromotion(fastify.db, result.data);
      reply.code(201).send(promo);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:id', authOnly, async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });
    const { id } = req.params as { id: string };
    const result = UpdatePromotionSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const promo = await promotionService.updatePromotion(fastify.db, id, result.data);
      reply.send(promo);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default promotionRoutes;

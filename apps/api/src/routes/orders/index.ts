import type { FastifyPluginAsync } from 'fastify';
import { CreateOrderSchema, UpdateStatusSchema } from '../../schemas/order.schema.js';
import * as orderService from '../../services/order.service.js';
import type { OrderStatus } from '@laundry-palu/shared';

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };

  fastify.post('/', authOnly, async (req, reply) => {
    const result = CreateOrderSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const order = await orderService.createOrder(fastify.db, result.data, req.user.id);
      reply.code(201).send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/', authOnly, async (req, reply) => {
    const { customer_id, status } = req.query as { customer_id?: string; status?: string };
    const opts: { customerId?: string; status?: string } = {};
    if (customer_id !== undefined) opts.customerId = customer_id;
    if (status !== undefined) opts.status = status;
    const orders = await orderService.listOrders(fastify.db, opts);
    reply.send(orders);
  });

  fastify.get('/:id', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const order = await orderService.getOrder(fastify.db, id);
      reply.send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:id/status', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = UpdateStatusSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const order = await orderService.updateOrderStatus(
        fastify.db,
        id,
        result.data.status as OrderStatus,
        req.user.id
      );
      reply.send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default orderRoutes;

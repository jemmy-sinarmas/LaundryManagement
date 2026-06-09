import type { FastifyPluginAsync } from 'fastify';
import { CreateOrderSchema, UpdateStatusSchema, RevertStatusSchema } from '../../schemas/order.schema.js';
import * as orderService from '../../services/order.service.js';
import type { OrderStatus } from '@laundry-palu/shared';

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };

  fastify.post('/', authOnly, async (req, reply) => {
    const result = CreateOrderSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    const branchId = req.user.branchId;
    if (!branchId) {
      return reply.code(400).send({ error: 'Super-admin harus memilih cabang sebelum membuat pesanan' });
    }
    try {
      const order = await orderService.createOrder(fastify.db, result.data, req.user.id, branchId);
      reply.code(201).send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/', authOnly, async (req, reply) => {
    const { customer_id, status, branch_id } = req.query as { customer_id?: string; status?: string; branch_id?: string };
    const isAdmin = req.user.role === 'admin';
    const branchId = isAdmin ? (branch_id ?? null) : req.user.branchId;
    const opts: { customerId?: string; status?: string; branchId?: string | null } = { branchId };
    if (customer_id !== undefined) opts.customerId = customer_id;
    if (status !== undefined) opts.status = status;
    const orders = await orderService.listOrders(fastify.db, opts);
    reply.send(orders);
  });

  // pickup QR routes — must be before /:id to avoid conflict
  fastify.get('/pickup/:token', authOnly, async (req, reply) => {
    const { token } = req.params as { token: string };
    try {
      const order = await orderService.getOrderByPickupToken(fastify.db, token);
      reply.send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/pickup/:token/complete', authOnly, async (req, reply) => {
    const { token } = req.params as { token: string };
    try {
      const order = await orderService.validatePickup(fastify.db, token, req.user.id);
      reply.send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
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
        req.user.id,
        result.data.catatan
      );
      reply.send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.post('/:id/revert-status', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = RevertStatusSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const order = await orderService.revertOrderStatus(
        fastify.db,
        id,
        req.user.id,
        result.data.catatan
      );
      reply.send(order);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default orderRoutes;

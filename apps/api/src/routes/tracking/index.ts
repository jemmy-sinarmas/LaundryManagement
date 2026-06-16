import type { FastifyPluginAsync } from 'fastify';
import * as orderRepo from '../../repositories/order.repo.js';

// No auth preHandler — public tracking routes
const trackingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/phone/:noHp', async (req, reply) => {
    const { noHp } = req.params as { noHp: string };
    const orders = await orderRepo.findByCustomerNoHp(fastify.db, noHp);
    reply.send(orders);
  });

  fastify.get('/t/:token', async (req, reply) => {
    const { token } = req.params as { token: string };
    const order = await orderRepo.findByPickupToken(fastify.db, token);
    if (!order) return reply.code(404).send({ error: 'Order not found' });
    reply.send(order);
  });

  fastify.get('/:invoiceNo', async (req, reply) => {
    const { invoiceNo } = req.params as { invoiceNo: string };
    const order = await orderRepo.findByInvoiceNo(fastify.db, invoiceNo);
    if (!order) return reply.code(404).send({ error: 'Order not found' });
    reply.send(order);
  });
};

export default trackingRoutes;

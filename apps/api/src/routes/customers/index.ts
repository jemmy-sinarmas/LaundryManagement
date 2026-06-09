import type { FastifyPluginAsync } from 'fastify';
import { CreateCustomerSchema, UpdateCustomerSchema } from '../../schemas/customer.schema.js';
import * as customerService from '../../services/customer.service.js';

const customerRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/', authOnly, async (req, reply) => {
    const { q } = req.query as { q?: string };
    const customers = await customerService.listCustomers(fastify.db, q);
    reply.send(customers);
  });

  fastify.post('/', authOnly, async (req, reply) => {
    const result = CreateCustomerSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const customer = await customerService.createCustomer(fastify.db, result.data);
      reply.code(201).send(customer);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/:id', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const customer = await customerService.getCustomer(fastify.db, id);
      reply.send(customer);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:id', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = UpdateCustomerSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const customer = await customerService.updateCustomer(fastify.db, id, result.data);
      reply.send(customer);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default customerRoutes;

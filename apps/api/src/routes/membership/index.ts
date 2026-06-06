import type { FastifyPluginAsync } from 'fastify';
import { CreateMembershipSchema } from '../../schemas/membership.schema.js';
import * as membershipService from '../../services/membership.service.js';

// Registered at prefix /api/v1/customers so routes use /:customerId/membership
const membershipRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/:customerId/membership', authOnly, async (req, reply) => {
    const { customerId } = req.params as { customerId: string };
    const membership = await membershipService.getMembershipForCustomer(fastify.db, customerId);
    reply.send(membership ?? null);
  });

  fastify.post('/:customerId/membership', adminOnly, async (req, reply) => {
    const { customerId } = req.params as { customerId: string };
    const result = CreateMembershipSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const membership = await membershipService.createMembership(fastify.db, customerId, result.data);
      reply.code(201).send(membership);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/:customerId/membership/validate', authOnly, async (req, reply) => {
    const { customerId } = req.params as { customerId: string };
    const result = await membershipService.validateCustomerMembership(fastify.db, customerId);
    reply.send(result);
  });
};

export default membershipRoutes;

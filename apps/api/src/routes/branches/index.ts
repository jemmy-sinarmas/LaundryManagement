import type { FastifyPluginAsync } from 'fastify';
import { CreateBranchSchema, UpdateBranchSchema } from '../../schemas/branch.schema.js';
import * as branchService from '../../services/branch.service.js';

const branchRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/', adminOnly, async (_req, reply) => {
    const branches = await branchService.listBranches(fastify.db);
    reply.send(branches);
  });

  fastify.post('/', adminOnly, async (req, reply) => {
    const result = CreateBranchSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const branch = await branchService.createBranch(fastify.db, result.data);
      reply.code(201).send(branch);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/:id', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const branch = await branchService.getBranch(fastify.db, id);
      reply.send(branch);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:id', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = UpdateBranchSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const branch = await branchService.updateBranch(fastify.db, id, result.data);
      reply.send(branch);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default branchRoutes;

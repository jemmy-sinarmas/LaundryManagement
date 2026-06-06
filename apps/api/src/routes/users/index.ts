import type { FastifyPluginAsync } from 'fastify';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ResetPasswordSchema,
} from '../../schemas/user.schema.js';
import * as userService from '../../services/user.service.js';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/', adminOnly, async (_req, reply) => {
    const users = await userService.listUsers(fastify.db);
    reply.send(users);
  });

  fastify.post('/', adminOnly, async (req, reply) => {
    const result = CreateUserSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const user = await userService.createUser(fastify.db, result.data);
      reply.code(201).send(user);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:id', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = UpdateUserSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const user = await userService.updateUser(fastify.db, id, result.data);
      reply.send(user);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.post('/:id/reset-password', adminOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = ResetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      await userService.resetPassword(fastify.db, id, result.data.password);
      reply.code(204).send();
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default userRoutes;

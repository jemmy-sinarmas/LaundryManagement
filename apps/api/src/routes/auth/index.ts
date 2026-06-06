import type { FastifyPluginAsync } from 'fastify';
import { LoginSchema } from '../../schemas/user.schema.js';
import * as userService from '../../services/user.service.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    const { username, password } = result.data;

    let user;
    try {
      user = await userService.login(fastify.db, username, password);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return reply.code(e.statusCode ?? 500).send({ error: e.message ?? 'Login failed' });
    }

    const token = fastify.jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '8h' }
    );

    reply
      .setCookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env['NODE_ENV'] === 'production',
      })
      .code(200)
      .send({ user });
  });

  fastify.delete('/logout', {
    preHandler: [fastify.authenticate],
  }, async (_req, reply) => {
    reply.clearCookie('token', { path: '/' }).code(204).send();
  });
};

export default authRoutes;

import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import type { FastifyPluginAsync, preHandlerHookHandler } from 'fastify';
import type { UserRole } from '@laundry-palu/shared';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; username: string; role: UserRole };
    user: { id: string; username: string; role: UserRole };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: preHandlerHookHandler;
    authorizeRoles: (...roles: UserRole[]) => preHandlerHookHandler;
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET env var is not set');

  await fastify.register(cookie);
  await fastify.register(jwt, {
    secret,
    cookie: { cookieName: 'token', signed: false },
  });

  fastify.decorate('authenticate', async function (req, reply) {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  } as preHandlerHookHandler);

  fastify.decorate('authorizeRoles', function (...roles: UserRole[]) {
    return async function (req: Parameters<preHandlerHookHandler>[0], reply: Parameters<preHandlerHookHandler>[1]) {
      try {
        await req.jwtVerify();
      } catch {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }
      if (!roles.includes(req.user.role as UserRole)) {
        reply.code(403).send({ error: 'Forbidden' });
      }
    } as preHandlerHookHandler;
  });
});

export default authPlugin;

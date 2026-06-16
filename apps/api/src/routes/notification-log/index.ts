import type { FastifyPluginAsync } from 'fastify';
import * as notificationLogRepo from '../../repositories/notification-log.repo.js';

const notificationLogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    preHandler: [fastify.authorizeRoles('admin')],
  }, async (_req, reply) => {
    const logs = await notificationLogRepo.findAll(fastify.db);
    reply.send(logs);
  });
};

export default notificationLogRoutes;

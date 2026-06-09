import type { FastifyPluginAsync } from 'fastify';
import { UpdateSettingsSchema } from '../../schemas/settings.schema.js';
import * as settingsService from '../../services/settings.service.js';

const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_req, reply) => {
    const settings = await settingsService.getSettings(fastify.db);
    reply.send(settings);
  });

  fastify.patch('/', {
    preHandler: [fastify.authorizeRoles('admin')],
  }, async (req, reply) => {
    const result = UpdateSettingsSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const settings = await settingsService.updateSettings(fastify.db, result.data);
      reply.send(settings);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default settingsRoutes;

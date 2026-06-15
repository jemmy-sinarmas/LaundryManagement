import type { FastifyPluginAsync } from 'fastify';
import {
  MessageTemplateTypeSchema,
  UpdateMessageTemplateSchema,
} from '../../schemas/message-template.schema.js';
import * as templateService from '../../services/message-template.service.js';

const messageTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/', adminOnly, async (_req, reply) => {
    const templates = await templateService.listTemplates(fastify.db);
    reply.send(templates);
  });

  fastify.get('/:type', adminOnly, async (req, reply) => {
    const parsed = MessageTemplateTypeSchema.safeParse((req.params as { type: string }).type);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Tipe template tidak valid' });
    }
    try {
      const template = await templateService.getTemplate(fastify.db, parsed.data);
      reply.send(template);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.patch('/:type', adminOnly, async (req, reply) => {
    const parsedType = MessageTemplateTypeSchema.safeParse((req.params as { type: string }).type);
    if (!parsedType.success) {
      return reply.code(400).send({ error: 'Tipe template tidak valid' });
    }
    const result = UpdateMessageTemplateSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const template = await templateService.updateTemplate(fastify.db, parsedType.data, result.data);
      reply.send(template);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default messageTemplateRoutes;

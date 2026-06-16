import type { FastifyPluginAsync } from 'fastify';
import { UpdateSettingsSchema } from '../../schemas/settings.schema.js';
import * as settingsService from '../../services/settings.service.js';
import { getSender } from '../../lib/whatsapp/index.js';

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
  fastify.post('/test-whatsapp', {
    preHandler: [fastify.authorizeRoles('admin')],
  }, async (_req, reply) => {
    const settings = await settingsService.getSettings(fastify.db);
    if (!settings.businessPhone) {
      return reply.code(400).send({ error: 'No. telepon bisnis belum diisi di Pengaturan.' });
    }
    const sender = getSender({
      enabled: settings.whatsappEnabled,
      provider: settings.whatsappProvider,
      apiUrl: settings.whatsappApiUrl,
      apiKey: settings.whatsappApiKey,
      sender: settings.whatsappSender,
    }, fastify.log);
    const message = `[Laundry Palu] Pesan tes berhasil dikirim — ${new Date().toLocaleString('id-ID')}`;
    try {
      const result = await sender.send(settings.businessPhone, message);
      reply.send({ status: result.status, error: result.error ?? null });
    } catch (err: unknown) {
      const e = err as { message?: string };
      reply.code(500).send({ error: e.message ?? 'Gagal mengirim pesan tes' });
    }
  });
};

export default settingsRoutes;

import type { FastifyPluginAsync } from 'fastify';
import * as reportService from '../../services/report.service.js';

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  fastify.get('/dashboard', adminOnly, async (_req, reply) => {
    try {
      const data = await reportService.getDashboard(fastify.db);
      reply.send(data);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/daily', adminOnly, async (req, reply) => {
    const { date: dateParam } = req.query as { date?: string };
    const date = dateParam ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return reply.code(400).send({ error: 'Invalid date format, use YYYY-MM-DD' });
    }
    const data = await reportService.getDailyReport(fastify.db, date);
    reply.send(data);
  });

  fastify.get('/monthly', adminOnly, async (req, reply) => {
    const { year: yearStr, month: monthStr } = req.query as { year?: string; month?: string };
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month || month < 1 || month > 12) {
      return reply.code(400).send({ error: 'year and month are required (e.g. ?year=2026&month=6)' });
    }
    const data = await reportService.getMonthlyReport(fastify.db, year, month);
    reply.send(data);
  });

  fastify.get('/income-statement', adminOnly, async (req, reply) => {
    const { from, to } = req.query as { from?: string; to?: string };
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !to || !dateRe.test(from) || !dateRe.test(to)) {
      return reply.code(400).send({ error: 'from and to are required (YYYY-MM-DD)' });
    }
    const data = await reportService.getIncomeStatement(fastify.db, from, to);
    reply.send(data);
  });

  fastify.get('/inventory', adminOnly, async (_req, reply) => {
    const data = await reportService.getInventoryReport(fastify.db);
    reply.send(data);
  });
};

export default reportRoutes;

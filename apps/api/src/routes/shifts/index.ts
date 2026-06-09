import type { FastifyPluginAsync } from 'fastify';
import { StartShiftSchema, EndShiftSchema } from '../../schemas/shift.schema.js';
import * as shiftService from '../../services/shift.service.js';

const shiftRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly  = { preHandler: [fastify.authenticate] };
  const adminOnly = { preHandler: [fastify.authorizeRoles('admin')] };

  // GET /shifts/current — kasir gets their own open shift
  fastify.get('/current', authOnly, async (req, reply) => {
    const shift = await shiftService.getCurrentShift(fastify.db, req.user.id);
    reply.send(shift ?? null);
  });

  // POST /shifts/start — kasir starts a shift
  fastify.post('/start', authOnly, async (req, reply) => {
    if (req.user.role !== 'kasir') return reply.code(403).send({ error: 'Hanya kasir yang dapat memulai shift' });
    const branchId = req.user.branchId;
    if (!branchId) return reply.code(400).send({ error: 'Kasir tidak memiliki cabang yang ditugaskan' });

    const result = StartShiftSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const shift = await shiftService.startShift(fastify.db, req.user.id, branchId, result.data.startCash);
      reply.code(201).send(shift);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  // POST /shifts/end — kasir ends their current shift
  fastify.post('/end', authOnly, async (req, reply) => {
    if (req.user.role !== 'kasir') return reply.code(403).send({ error: 'Hanya kasir yang dapat mengakhiri shift' });

    const result = EndShiftSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const shift = await shiftService.endShift(
        fastify.db,
        req.user.id,
        result.data.endCash,
        result.data.notes ?? null
      );
      reply.send(shift);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  // GET /shifts — admin lists shifts with optional filters
  fastify.get('/', adminOnly, async (req, reply) => {
    const { from, to, branch_id } = req.query as { from?: string; to?: string; branch_id?: string };
    const shifts = await shiftService.listShifts(fastify.db, {
      branchId: branch_id,
      from,
      to,
    });
    reply.send(shifts);
  });
};

export default shiftRoutes;

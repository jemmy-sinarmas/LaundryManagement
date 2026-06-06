import type { FastifyPluginAsync } from 'fastify';
import { CreateExpenseSchema } from '../../schemas/expense.schema.js';
import * as expenseService from '../../services/expense.service.js';

const expenseRoutes: FastifyPluginAsync = async (fastify) => {
  const authOnly = { preHandler: [fastify.authenticate] };

  fastify.get('/', authOnly, async (req, reply) => {
    const { from, to, category_id } = req.query as {
      from?: string;
      to?: string;
      category_id?: string;
    };
    const opts: { from?: string; to?: string; categoryId?: string } = {};
    if (from !== undefined) opts.from = from;
    if (to !== undefined) opts.to = to;
    if (category_id !== undefined) opts.categoryId = category_id;
    const expenses = await expenseService.listExpenses(fastify.db, opts);
    reply.send(expenses);
  });

  fastify.post('/', authOnly, async (req, reply) => {
    const result = CreateExpenseSchema.safeParse(req.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Validation error', details: result.error.flatten() });
    }
    try {
      const expense = await expenseService.createExpense(fastify.db, result.data, req.user.id);
      reply.code(201).send(expense);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  fastify.get('/:id', authOnly, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const expense = await expenseService.getExpense(fastify.db, id);
      reply.send(expense);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
};

export default expenseRoutes;

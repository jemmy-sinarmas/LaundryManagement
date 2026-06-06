import { z } from 'zod';
import { EXPENSE_LEVELS } from '@laundry-palu/shared';

export const CreateExpenseCategorySchema = z.object({
  nama: z.string().min(1).max(100),
  level: z.enum(EXPENSE_LEVELS),
});

export type CreateExpenseCategoryInput = z.infer<typeof CreateExpenseCategorySchema>;

import { z } from 'zod';
import { EXPENSE_PAYMENT_METHODS } from '@laundry-palu/shared';

export const CreateExpenseSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  jumlah: z.number().int().positive(),
  categoryId: z.string().uuid(),
  deskripsi: z.string().nullable().optional(),
  inventoryItemId: z.string().uuid().nullable().optional(),
  qtyUsed: z.number().positive().nullable().optional(),
  metodePembayaran: z.enum(EXPENSE_PAYMENT_METHODS).default('tunai'),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

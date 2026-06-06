import { z } from 'zod';
import { ORDER_STATUSES } from '@laundry-palu/shared';

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  catatan: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        qty: z.number().positive(),
      })
    )
    .min(1),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

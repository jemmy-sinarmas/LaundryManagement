import { z } from 'zod';
import { ORDER_STATUSES } from '@laundry-palu/shared';

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  catatan: z.string().nullable().optional(),
  promoId: z.string().uuid().optional(),
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
  catatan: z.string().optional(),
});

export const RevertStatusSchema = z.object({
  catatan: z.string().min(1, 'Catatan wajib diisi untuk membatalkan status'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type RevertStatusInput = z.infer<typeof RevertStatusSchema>;

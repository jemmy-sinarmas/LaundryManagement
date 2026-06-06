import { z } from 'zod';

export const CreateItemSchema = z.object({
  nama: z.string().min(1).max(100),
  tipe: z.enum(['satuan', 'kiloan', 'jasa_lain']),
  harga: z.number().int().positive(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

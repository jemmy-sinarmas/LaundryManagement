import { z } from 'zod';

export const CreatePromotionSchema = z.object({
  nama:           z.string().min(1),
  tipe:           z.enum(['persen', 'nominal']),
  nilai:          z.number().positive(),
  minOrder:       z.number().min(0).optional(),
  tanggalMulai:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  branchId:       z.string().uuid().optional(),
});

export const UpdatePromotionSchema = z.object({
  nama:           z.string().min(1).optional(),
  nilai:          z.number().positive().optional(),
  minOrder:       z.number().min(0).optional(),
  tanggalMulai:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tanggalSelesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive:       z.boolean().optional(),
});

export type CreatePromotionInput = z.infer<typeof CreatePromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof UpdatePromotionSchema>;

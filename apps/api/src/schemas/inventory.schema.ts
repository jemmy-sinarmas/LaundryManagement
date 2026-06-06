import { z } from 'zod';

export const CreateInventoryItemSchema = z.object({
  nama: z.string().min(1).max(100),
  satuan: z.string().min(1).max(30),
  stokMinimum: z.number().min(0),
});

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();

export const RecordPurchaseSchema = z.object({
  qty: z.number().positive(),
  hargaPerUnit: z.number().int().positive(),
  referensi: z.string().nullable().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>;
export type RecordPurchaseInput = z.infer<typeof RecordPurchaseSchema>;

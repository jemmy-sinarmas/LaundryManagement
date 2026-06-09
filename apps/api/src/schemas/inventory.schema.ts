import { z } from 'zod';

export const CreateInventoryItemSchema = z.object({
  nama: z.string().min(1).max(100),
  satuan: z.string().min(1).max(30),
  stokMinimum: z.number().min(0),
  branchId: z.string().uuid(),
});

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();

export const RecordPurchaseSchema = z.object({
  qty: z.number().positive(),
  hargaPerUnit: z.number().int().positive(),
  referensi: z.string().nullable().optional(),
});

export const BulkPurchaseSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().uuid(),
    qty: z.number().positive(),
    hargaPerUnit: z.number().int().positive(),
    referensi: z.string().nullable().optional(),
  })).min(1),
  fotoReferensi: z.string().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>;
export type RecordPurchaseInput = z.infer<typeof RecordPurchaseSchema>;
export type BulkPurchaseInput = z.infer<typeof BulkPurchaseSchema>;

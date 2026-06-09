import { z } from 'zod';

export const CreateBranchSchema = z.object({
  nama: z.string().min(1).max(100),
  kode: z.string().min(1).max(10).toUpperCase(),
  alamat: z.string().nullable().optional(),
});

export const UpdateBranchSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  alamat: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>;

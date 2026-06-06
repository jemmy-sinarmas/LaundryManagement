import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  nama: z.string().min(1).max(100),
  alamat: z.string().nullable().optional(),
  noHp: z.string().min(8).max(20),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

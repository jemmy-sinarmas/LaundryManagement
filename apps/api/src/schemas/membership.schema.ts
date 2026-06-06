import { z } from 'zod';

export const CreateMembershipSchema = z.discriminatedUnion('tipe', [
  z.object({
    tipe: z.literal('periodik'),
    durasibulan: z.union([z.literal(3), z.literal(6), z.literal(12)]),
    tanggalMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  }),
  z.object({
    tipe: z.literal('paket_kg'),
    paketKg: z.number().positive(),
  }),
]);

export type CreateMembershipInput = z.infer<typeof CreateMembershipSchema>;

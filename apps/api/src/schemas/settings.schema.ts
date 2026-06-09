import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
  businessName:    z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone:   z.string().optional(),
  invoiceFooter:   z.string().optional(),
  logoBase64:      z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

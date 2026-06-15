import { z } from 'zod';

export const UpdateSettingsSchema = z.object({
  businessName:    z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone:   z.string().optional(),
  invoiceFooter:   z.string().optional(),
  logoBase64:      z.string().optional(),
  ppnPercent:      z.number().min(0).max(100).optional(),
  gratuityPercent: z.number().min(0).max(100).optional(),
  saldoAwalKas:    z.number().int().min(0).optional(),
  whatsappEnabled:  z.boolean().optional(),
  whatsappProvider: z.string().optional(),
  whatsappApiUrl:   z.string().optional(),
  whatsappApiKey:   z.string().optional(),
  whatsappSender:   z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

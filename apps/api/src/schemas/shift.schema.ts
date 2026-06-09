import { z } from 'zod';

export const StartShiftSchema = z.object({
  startCash: z.number().int().min(0),
});

export const EndShiftSchema = z.object({
  endCash: z.number().int().min(0),
  notes:   z.string().optional(),
});

export type StartShiftInput = z.infer<typeof StartShiftSchema>;
export type EndShiftInput   = z.infer<typeof EndShiftSchema>;

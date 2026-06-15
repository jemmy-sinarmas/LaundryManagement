import { z } from 'zod';
import { MESSAGE_TEMPLATE_TYPES } from '@laundry-palu/shared';

export const MessageTemplateTypeSchema = z.enum(MESSAGE_TEMPLATE_TYPES);

export const UpdateMessageTemplateSchema = z
  .object({
    header: z.string(),
    footer: z.string(),
    isActive: z.boolean(),
  })
  .partial();

export type UpdateMessageTemplateInput = z.infer<typeof UpdateMessageTemplateSchema>;

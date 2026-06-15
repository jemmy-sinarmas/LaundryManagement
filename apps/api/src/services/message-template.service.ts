import type { MessageTemplate, MessageTemplateType } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as templateRepo from '../repositories/message-template.repo.js';
import type { UpdateMessageTemplateInput } from '../schemas/message-template.schema.js';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listTemplates(db: SqlDb): Promise<MessageTemplate[]> {
  return templateRepo.findAll(db);
}

export async function getTemplate(
  db: SqlDb,
  type: MessageTemplateType
): Promise<MessageTemplate> {
  const template = await templateRepo.findByType(db, type);
  if (!template) throw makeError('Template not found', 404);
  return template;
}

export async function updateTemplate(
  db: SqlDb,
  type: MessageTemplateType,
  data: UpdateMessageTemplateInput
): Promise<MessageTemplate> {
  const template = await templateRepo.update(db, type, data);
  if (!template) throw makeError('Template not found', 404);
  return template;
}

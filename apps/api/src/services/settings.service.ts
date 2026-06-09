import type { AppSettings } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as settingsRepo from '../repositories/settings.repo.js';
import type { UpdateSettingsInput } from '../schemas/settings.schema.js';

export async function getSettings(db: SqlDb): Promise<AppSettings> {
  return settingsRepo.getAll(db);
}

export async function updateSettings(
  db: SqlDb,
  input: UpdateSettingsInput
): Promise<AppSettings> {
  return settingsRepo.upsertMany(db, input);
}

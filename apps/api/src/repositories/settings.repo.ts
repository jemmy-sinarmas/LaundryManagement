import type { AppSettings } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type SettingsRow = { key: string; value: string };

const CAMEL_TO_DB: Record<keyof AppSettings, string> = {
  businessName:    'business_name',
  businessAddress: 'business_address',
  businessPhone:   'business_phone',
  invoiceFooter:   'invoice_footer',
  logoBase64:      'logo_base64',
  ppnPercent:      'ppn_percent',
  gratuityPercent: 'gratuity_percent',
};

function rowsToSettings(rows: SettingsRow[]): AppSettings {
  const raw: Record<string, string> = {};
  for (const row of rows) raw[row.key] = row.value;
  return {
    businessName:    raw['business_name']    ?? '',
    businessAddress: raw['business_address'] ?? '',
    businessPhone:   raw['business_phone']   ?? '',
    invoiceFooter:   raw['invoice_footer']   ?? '',
    logoBase64:      raw['logo_base64']      ?? '',
    ppnPercent:      Number(raw['ppn_percent']      ?? 0),
    gratuityPercent: Number(raw['gratuity_percent'] ?? 0),
  };
}

export async function getAll(db: SqlDb): Promise<AppSettings> {
  const rows = await db<SettingsRow>`SELECT key, value FROM settings`;
  return rowsToSettings(rows);
}

export async function upsertMany(
  db: SqlDb,
  updates: { [K in keyof AppSettings]?: AppSettings[K] | undefined }
): Promise<AppSettings> {
  for (const [camel, value] of Object.entries(updates) as [keyof AppSettings, AppSettings[keyof AppSettings] | undefined][]) {
    if (value === undefined) continue;
    const dbKey = CAMEL_TO_DB[camel];
    if (!dbKey) continue;
    const strValue = String(value);
    await db`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${dbKey}, ${strValue}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
  }
  return getAll(db);
}

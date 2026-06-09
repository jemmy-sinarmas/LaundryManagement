import type { AppSettings } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';

type SettingsRow = { key: string; value: string };

const KEY_MAP: Record<string, keyof AppSettings> = {
  business_name:    'businessName',
  business_address: 'businessAddress',
  business_phone:   'businessPhone',
  invoice_footer:   'invoiceFooter',
  logo_base64:      'logoBase64',
};

const CAMEL_TO_DB: Record<keyof AppSettings, string> = {
  businessName:    'business_name',
  businessAddress: 'business_address',
  businessPhone:   'business_phone',
  invoiceFooter:   'invoice_footer',
  logoBase64:      'logo_base64',
};

function rowsToSettings(rows: SettingsRow[]): AppSettings {
  const result: Partial<AppSettings> = {};
  for (const row of rows) {
    const camel = KEY_MAP[row.key];
    if (camel) (result as Record<string, string>)[camel] = row.value;
  }
  return {
    businessName:    result.businessName    ?? '',
    businessAddress: result.businessAddress ?? '',
    businessPhone:   result.businessPhone   ?? '',
    invoiceFooter:   result.invoiceFooter   ?? '',
    logoBase64:      result.logoBase64      ?? '',
  };
}

export async function getAll(db: SqlDb): Promise<AppSettings> {
  const rows = await db<SettingsRow>`SELECT key, value FROM settings`;
  return rowsToSettings(rows);
}

export async function upsertMany(
  db: SqlDb,
  updates: { [K in keyof AppSettings]?: string | undefined }
): Promise<AppSettings> {
  for (const [camel, value] of Object.entries(updates) as [keyof AppSettings, string][]) {
    const dbKey = CAMEL_TO_DB[camel];
    if (!dbKey) continue;
    await db`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${dbKey}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
  }
  return getAll(db);
}

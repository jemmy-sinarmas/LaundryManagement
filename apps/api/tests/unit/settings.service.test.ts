import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as settingsService from '../../src/services/settings.service.js';
import type { SqlDb } from '../../src/lib/db-types.js';
import type { AppSettings } from '@laundry-palu/shared';

vi.mock('../../src/repositories/settings.repo.js');

import * as settingsRepo from '../../src/repositories/settings.repo.js';

const mockDb = {} as SqlDb;

const baseSettings: AppSettings = {
  businessName: 'Laundry Palu',
  businessAddress: 'Jl. Sample 1',
  businessPhone: '0451-000000',
  invoiceFooter: 'Terima kasih',
  logoBase64: '',
  ppnPercent: 0,
  gratuityPercent: 0,
  saldoAwalKas: 0,
  whatsappEnabled: false,
  whatsappProvider: '',
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappSender: '',
};

describe('settingsService.getSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates to settingsRepo.getAll', async () => {
    vi.mocked(settingsRepo.getAll).mockResolvedValue(baseSettings);
    const result = await settingsService.getSettings(mockDb);
    expect(settingsRepo.getAll).toHaveBeenCalledWith(mockDb);
    expect(result).toEqual(baseSettings);
  });
});

describe('settingsService.updateSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('forwards the partial update to settingsRepo.upsertMany', async () => {
    const updated = { ...baseSettings, businessName: 'New Name', ppnPercent: 11 };
    vi.mocked(settingsRepo.upsertMany).mockResolvedValue(updated);
    const result = await settingsService.updateSettings(mockDb, {
      businessName: 'New Name',
      ppnPercent: 11,
    });
    expect(settingsRepo.upsertMany).toHaveBeenCalledWith(mockDb, {
      businessName: 'New Name',
      ppnPercent: 11,
    });
    expect(result.businessName).toBe('New Name');
  });
});

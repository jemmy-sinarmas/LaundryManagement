import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MessageTemplate } from '@laundry-palu/shared';
import * as templateService from '../../src/services/message-template.service.js';
import type { SqlDb } from '../../src/lib/db-types.js';

vi.mock('../../src/repositories/message-template.repo.js');

import * as templateRepo from '../../src/repositories/message-template.repo.js';

const mockDb = {} as SqlDb;

const baseTemplate: MessageTemplate = {
  id: 't1',
  type: 'payment_receipt',
  header: 'Header',
  footer: 'Footer',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('templateService.getTemplate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the template', async () => {
    vi.mocked(templateRepo.findByType).mockResolvedValue(baseTemplate);
    const t = await templateService.getTemplate(mockDb, 'payment_receipt');
    expect(t.type).toBe('payment_receipt');
  });

  it('throws 404 when not found', async () => {
    vi.mocked(templateRepo.findByType).mockResolvedValue(null);
    await expect(templateService.getTemplate(mockDb, 'payment_receipt')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('templateService.updateTemplate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists header/footer/isActive', async () => {
    const updated = { ...baseTemplate, header: 'New', isActive: false };
    vi.mocked(templateRepo.update).mockResolvedValue(updated);
    const t = await templateService.updateTemplate(mockDb, 'payment_receipt', {
      header: 'New',
      isActive: false,
    });
    expect(templateRepo.update).toHaveBeenCalledWith(mockDb, 'payment_receipt', {
      header: 'New',
      isActive: false,
    });
    expect(t.header).toBe('New');
    expect(t.isActive).toBe(false);
  });

  it('throws 404 when template missing', async () => {
    vi.mocked(templateRepo.update).mockResolvedValue(null);
    await expect(
      templateService.updateTemplate(mockDb, 'payment_receipt', { header: 'x' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

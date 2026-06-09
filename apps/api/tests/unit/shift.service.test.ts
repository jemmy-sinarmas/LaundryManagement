import { describe, it, expect, vi, afterEach } from 'vitest';
import { startShift, endShift, getCurrentShift } from '../../src/services/shift.service.js';
import type { Shift } from '@laundry-palu/shared';

vi.mock('../../src/repositories/shift.repo.js');

import * as shiftRepo from '../../src/repositories/shift.repo.js';

afterEach(() => {
  vi.clearAllMocks();
});

const mockDb = {} as Parameters<typeof startShift>[0];

const mockShift: Shift = {
  id: 'shift-1',
  kasirId: 'kasir-1',
  branchId: 'branch-1',
  startTime: '2026-06-09T08:00:00Z',
  endTime: null,
  startCash: 200000,
  endCash: null,
  notes: null,
  createdAt: '2026-06-09T08:00:00Z',
};

const closedShift: Shift = {
  ...mockShift,
  endTime: '2026-06-09T17:00:00Z',
  endCash: 500000,
  notes: 'Normal',
};

describe('getCurrentShift', () => {
  it('returns current open shift', async () => {
    vi.mocked(shiftRepo.findCurrent).mockResolvedValue(mockShift);
    const result = await getCurrentShift(mockDb, 'kasir-1');
    expect(result).toEqual(mockShift);
    expect(shiftRepo.findCurrent).toHaveBeenCalledWith(mockDb, 'kasir-1');
  });

  it('returns null when no open shift', async () => {
    vi.mocked(shiftRepo.findCurrent).mockResolvedValue(null);
    const result = await getCurrentShift(mockDb, 'kasir-1');
    expect(result).toBeNull();
  });
});

describe('startShift', () => {
  it('starts a shift when none is active', async () => {
    vi.mocked(shiftRepo.findCurrent).mockResolvedValue(null);
    vi.mocked(shiftRepo.startShift).mockResolvedValue(mockShift);

    const result = await startShift(mockDb, 'kasir-1', 'branch-1', 200000);
    expect(result).toEqual(mockShift);
    expect(shiftRepo.startShift).toHaveBeenCalledWith(mockDb, 'kasir-1', 'branch-1', 200000);
  });

  it('throws 409 when a shift is already active', async () => {
    vi.mocked(shiftRepo.findCurrent).mockResolvedValue(mockShift);

    await expect(startShift(mockDb, 'kasir-1', 'branch-1', 200000)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(shiftRepo.startShift).not.toHaveBeenCalled();
  });
});

describe('endShift', () => {
  it('ends the current open shift', async () => {
    vi.mocked(shiftRepo.findCurrent).mockResolvedValue(mockShift);
    vi.mocked(shiftRepo.endShift).mockResolvedValue(closedShift);

    const result = await endShift(mockDb, 'kasir-1', 500000, 'Normal');
    expect(result).toEqual(closedShift);
    expect(shiftRepo.endShift).toHaveBeenCalledWith(mockDb, 'shift-1', 500000, 'Normal');
  });

  it('throws 404 when no active shift to end', async () => {
    vi.mocked(shiftRepo.findCurrent).mockResolvedValue(null);

    await expect(endShift(mockDb, 'kasir-1', 500000, null)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(shiftRepo.endShift).not.toHaveBeenCalled();
  });
});

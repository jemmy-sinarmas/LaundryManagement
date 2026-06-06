import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import * as userService from '../../src/services/user.service.js';
import type { SqlDb } from '../../src/lib/db-types.js';

vi.mock('../../src/repositories/user.repo.js');

import * as userRepo from '../../src/repositories/user.repo.js';

const mockDb = {} as SqlDb;

// Real bcrypt hash generated at cost 4 (fast for tests)
const VALID_HASH = bcrypt.hashSync('password123', 4);

const baseUser = {
  id: 'user-1',
  nama: 'Admin Utama',
  username: 'admin',
  password: VALID_HASH,
  role: 'admin' as const,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('userService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns user without password on valid credentials', async () => {
    vi.mocked(userRepo.findByUsername).mockResolvedValue({ ...baseUser });
    const user = await userService.login(mockDb, 'admin', 'password123');
    expect(user).not.toHaveProperty('password');
    expect(user.username).toBe('admin');
    expect(user.role).toBe('admin');
  });

  it('throws 401 on unknown username', async () => {
    vi.mocked(userRepo.findByUsername).mockResolvedValue(null);
    await expect(userService.login(mockDb, 'ghost', 'any')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 on wrong password', async () => {
    vi.mocked(userRepo.findByUsername).mockResolvedValue({ ...baseUser });
    await expect(userService.login(mockDb, 'admin', 'wrongpassword')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 for inactive user', async () => {
    vi.mocked(userRepo.findByUsername).mockResolvedValue({ ...baseUser, isActive: false });
    await expect(userService.login(mockDb, 'admin', 'password123')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe('userService.createUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stores a bcrypt hash, not plaintext password', async () => {
    vi.mocked(userRepo.create).mockImplementation(async (_db, data) => ({
      ...baseUser,
      id: data.id,
      nama: data.nama,
      username: data.username,
      password: data.passwordHash,
      role: data.role as 'admin' | 'kasir',
    }));

    await userService.createUser(mockDb, {
      nama: 'New User',
      username: 'newuser',
      password: 'plaintext',
      role: 'kasir',
    });

    const createCall = vi.mocked(userRepo.create).mock.calls[0];
    expect(createCall).toBeDefined();
    const passedData = createCall![1];
    expect(passedData.passwordHash).not.toBe('plaintext');
    expect(passedData.passwordHash).toMatch(/^\$2b\$/);
  });

  it('returns user without password field', async () => {
    vi.mocked(userRepo.create).mockResolvedValue({ ...baseUser });
    const user = await userService.createUser(mockDb, {
      nama: 'Test',
      username: 'test',
      password: 'secret123',
      role: 'kasir',
    });
    expect(user).not.toHaveProperty('password');
  });
});

describe('userService.updateUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when user not found', async () => {
    vi.mocked(userRepo.update).mockResolvedValue(null);
    await expect(
      userService.updateUser(mockDb, 'nonexistent', { nama: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns updated user without password', async () => {
    vi.mocked(userRepo.update).mockResolvedValue({ ...baseUser, nama: 'Updated' });
    const user = await userService.updateUser(mockDb, 'user-1', { nama: 'Updated' });
    expect(user.nama).toBe('Updated');
    expect(user).not.toHaveProperty('password');
  });
});

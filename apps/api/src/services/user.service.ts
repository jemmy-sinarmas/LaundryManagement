import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { User } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import * as userRepo from '../repositories/user.repo.js';
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schema.js';

function stripPassword(user: User & { password: string }): User {
  const { password: _pw, ...safe } = user;
  return safe;
}

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function login(db: SqlDb, username: string, password: string): Promise<User> {
  const user = await userRepo.findByUsername(db, username);
  if (!user || !user.isActive) throw makeError('Invalid credentials', 401);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw makeError('Invalid credentials', 401);
  return stripPassword(user);
}

export async function listUsers(db: SqlDb): Promise<User[]> {
  const users = await userRepo.findAll(db);
  return users.map(stripPassword);
}

export async function createUser(db: SqlDb, data: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await userRepo.create(db, { id: randomUUID(), ...data, passwordHash });
  return stripPassword(user);
}

export async function updateUser(
  db: SqlDb,
  id: string,
  data: UpdateUserInput
): Promise<User> {
  const user = await userRepo.update(db, id, data);
  if (!user) throw makeError('User not found', 404);
  return stripPassword(user);
}

export async function resetPassword(
  db: SqlDb,
  id: string,
  newPassword: string
): Promise<void> {
  const existing = await userRepo.findById(db, id);
  if (!existing) throw makeError('User not found', 404);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userRepo.updatePassword(db, id, passwordHash);
}

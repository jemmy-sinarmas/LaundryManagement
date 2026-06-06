import type { User } from '@laundry-palu/shared';
import type { SqlDb } from '../lib/db-types.js';
import type { CreateUserInput } from '../schemas/user.schema.js';

type UserRow = {
  id: string;
  nama: string;
  username: string;
  password: string;
  role: string;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): User & { password: string } {
  return {
    id: row.id,
    nama: row.nama,
    username: row.username,
    password: row.password,
    role: row.role as User['role'],
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByUsername(
  db: SqlDb,
  username: string
): Promise<(User & { password: string }) | null> {
  const rows = await db<UserRow>`
    SELECT * FROM users WHERE username = ${username} LIMIT 1
  `;
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findById(
  db: SqlDb,
  id: string
): Promise<(User & { password: string }) | null> {
  const rows = await db<UserRow>`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findAll(db: SqlDb): Promise<(User & { password: string })[]> {
  const rows = await db<UserRow>`
    SELECT * FROM users ORDER BY created_at DESC
  `;
  return rows.map(mapUser);
}

export async function create(
  db: SqlDb,
  data: { id: string } & CreateUserInput & { passwordHash: string }
): Promise<User & { password: string }> {
  const rows = await db<UserRow>`
    INSERT INTO users (id, nama, username, password, role)
    VALUES (${data.id}, ${data.nama}, ${data.username}, ${data.passwordHash}, ${data.role})
    RETURNING *
  `;
  if (!rows[0]) throw new Error('Insert failed');
  return mapUser(rows[0]);
}

export async function update(
  db: SqlDb,
  id: string,
  data: { nama?: string | undefined; role?: string | undefined; isActive?: boolean | undefined }
): Promise<(User & { password: string }) | null> {
  const existing = await findById(db, id);
  if (!existing) return null;

  const nama = data.nama ?? existing.nama;
  const role = data.role ?? existing.role;
  const isActive = data.isActive !== undefined ? data.isActive : existing.isActive;
  const isActiveVal = isActive ? 1 : 0;

  const rows = await db<UserRow>`
    UPDATE users SET nama = ${nama}, role = ${role}, is_active = ${isActiveVal},
      updated_at = datetime('now')
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function updatePassword(
  db: SqlDb,
  id: string,
  passwordHash: string
): Promise<void> {
  await db`
    UPDATE users SET password = ${passwordHash}, updated_at = datetime('now')
    WHERE id = ${id}
  `;
}

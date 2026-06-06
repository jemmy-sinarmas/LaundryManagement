import type { UserRole } from '@laundry-palu/shared';

export type JwtPayload = { id: string; username: string; role: UserRole };

export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

import { describe, it, expect } from 'vitest';
import { decodeToken } from '@/lib/auth';

function makeToken(payload: object): string {
  const segment = btoa(JSON.stringify(payload));
  return `header.${segment}.signature`;
}

describe('decodeToken', () => {
  it('decodes the payload segment of a JWT', () => {
    const token = makeToken({ id: 'u1', username: 'admin', role: 'admin' });
    expect(decodeToken(token)).toEqual({ id: 'u1', username: 'admin', role: 'admin' });
  });

  it('returns null for a token with no payload segment', () => {
    expect(decodeToken('justonesegment')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(decodeToken('')).toBeNull();
  });

  it('returns null when the payload is not valid base64/JSON', () => {
    expect(decodeToken('header.!!!notbase64!!!.sig')).toBeNull();
  });
});

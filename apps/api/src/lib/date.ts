/**
 * Normalize a Postgres DATE column value to a 'YYYY-MM-DD' string.
 *
 * The postgres.js driver returns `date` columns as JS `Date` objects (UTC
 * midnight), whereas the PGLite/sqlite adapter returns them as strings. Repos
 * must handle both so the same mapping code works against either backend.
 */
export function dateOnly(value: string | Date): string {
  return (typeof value === 'string' ? value : value.toISOString()).slice(0, 10);
}

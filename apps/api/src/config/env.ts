import { z } from 'zod';

/**
 * Centralized environment validation. Parsed once at startup (inside buildApp) so a
 * misconfigured deployment fails fast with a clear message instead of surfacing as a
 * late, confusing runtime error (e.g. a weak JWT secret or missing DB URL).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('8h'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validate process.env against the schema. Throws an aggregated, readable error listing
 * every invalid/missing variable. Result is cached so repeated calls are cheap.
 */
export function loadEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cached = result.data;
  return cached;
}

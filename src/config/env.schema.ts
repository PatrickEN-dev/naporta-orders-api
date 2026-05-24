import { z } from 'zod';

const ttlPattern = /^\d+(ms|s|m|h|d)$/;

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().url(),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
    JWT_ACCESS_TTL: z.string().regex(ttlPattern).default('15m'),
    JWT_REFRESH_TTL: z.string().regex(ttlPattern).default('7d'),

    CORS_ORIGINS: z.string().default('*'),

    RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    MEMORY_HEAP_LIMIT_MB: z.coerce.number().int().positive().default(256),
    DB_PING_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),

    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  })
  .refine((env) => !(env.NODE_ENV === 'production' && env.CORS_ORIGINS === '*'), {
    message: 'CORS_ORIGINS cannot be "*" in production',
    path: ['CORS_ORIGINS'],
  })
  .refine(
    (env) => !(env.NODE_ENV === 'production' && env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET),
    { message: 'JWT secrets must differ in production', path: ['JWT_REFRESH_SECRET'] },
  );

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

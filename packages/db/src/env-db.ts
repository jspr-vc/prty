import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    /**
     * Optional. Migrations and seeds run DDL and want a session they can hold,
     * which the transaction pooler cannot give them. Falls back to DATABASE_URL,
     * which is right for local development where there is only one connection.
     */
    DIRECT_DATABASE_URL: z.url().optional(),
    /**
     * Optional. Without redis, sessions live in postgres alone and better-auth
     * keeps verification records in the `verification` table instead.
     */
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})

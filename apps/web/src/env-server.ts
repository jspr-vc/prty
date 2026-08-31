import { createEnv } from '@t3-oss/env-nextjs'
import { env as authEnv } from '@workspace/auth/env'
import { env as dbEnv } from '@workspace/db/env'
import { env as realtimeEnv } from '@workspace/realtime/env'
import { z } from 'zod'

export const env = createEnv({
  extends: [authEnv, dbEnv, realtimeEnv],
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  experimental__runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})

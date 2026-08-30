import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_GAMEMASTER_URL: z.url(),
    NEXT_PUBLIC_GAMECLIENT_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_GAMEMASTER_URL: process.env.NEXT_PUBLIC_GAMEMASTER_URL,
    NEXT_PUBLIC_GAMECLIENT_URL: process.env.NEXT_PUBLIC_GAMECLIENT_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})

import { createEnv } from '@t3-oss/env-nextjs'

/**
 * Nothing here yet. Anything the browser needs about the other host is passed
 * down as a prop from a server component, so it stays changeable at runtime
 * instead of being baked into the bundle.
 */
export const env = createEnv({
  client: {},
  runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})

import { Redis } from '@upstash/redis'
import { env } from './env-db'

/**
 * Optional. Redis is a cache in front of postgres, not the only copy of
 * anything, so the app runs without it — just with one more database round trip
 * per session lookup. Callers must handle null.
 */
export const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export type RedisClient = typeof redis

import { db, redis, schema } from '@workspace/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin as adminPlugin, organization } from 'better-auth/plugins'
import { env } from './env-auth'
import { ac, roles } from './permissions'

type RedisClient = NonNullable<typeof redis>

/**
 * Optional: a cache in front of postgres. Without it better-auth reads sessions
 * from the database every time and keeps verification records in the
 * `verification` table, which is slower but entirely correct.
 *
 * Taking the client as an argument rather than closing over the import is what
 * lets TypeScript see it as non-null inside these callbacks.
 */
function cacheIn(client: RedisClient) {
  return {
    get: async (key: string) => (await client.get<string>(key)) ?? null,
    set: async (key: string, value: string, ttl?: number) => {
      if (ttl) await client.set(key, value, { ex: ttl })
      else await client.set(key, value)
    },
    delete: async (key: string) => {
      await client.del(key)
    },
    getAndDelete: async (key: string) => (await client.getdel<string>(key)) ?? null,
    increment: async (key: string, ttl?: number) => {
      const count = await client.incr(key)
      if (ttl && count === 1) await client.expire(key, ttl)
      return count
    },
  }
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
      verification: schema.verification,
    },
  }),
  ...(redis ? { secondaryStorage: cacheIn(redis) } : {}),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Postgres is always the source of truth, so flushing redis (or removing it
    // entirely) must not sign every host out mid-show.
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [organization({ ac, roles }), adminPlugin(), nextCookies()],
})

export type Auth = typeof auth
export type Session = Auth['$Infer']['Session']
export type User = Session['user']

export { ac, roles } from './permissions'

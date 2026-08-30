import { db, redis, schema } from '@workspace/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin as adminPlugin, organization } from 'better-auth/plugins'
import { env } from './env-auth'
import { ac, roles } from './permissions'

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
    },
  }),
  secondaryStorage: {
    get: async (key) => (await redis.get<string>(key)) ?? null,
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, { ex: ttl })
      else await redis.set(key, value)
    },
    delete: async (key) => {
      await redis.del(key)
    },
    getAndDelete: async (key) => (await redis.getdel<string>(key)) ?? null,
    increment: async (key, ttl) => {
      const count = await redis.incr(key)
      if (ttl && count === 1) await redis.expire(key, ttl)
      return count
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Redis is a cache in front of postgres, not the only copy: flushing redis
    // must not sign every host out mid-show.
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

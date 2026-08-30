import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { MemoryCache } from './cache'
import { env } from './env-db'
import * as schema from './schema'

/**
 * Supabase's transaction pooler (Supavisor on port 6543) hands a different
 * backend connection to every transaction, so a prepared statement created by
 * one query is not there for the next — postgres-js prepares by default and
 * would fail with "prepared statement does not exist". It is also the string to
 * use from serverless, where a large client-side pool just exhausts the server.
 *
 * A direct or session-mode connection keeps one backend per client, so both
 * prepared statements and a real pool are fine.
 */
function poolOptions(url: string | undefined): postgres.Options<Record<string, never>> {
  // SKIP_ENV_VALIDATION makes the typed env lie: during a build with no database
  // configured this is undefined, and the module still has to evaluate.
  const transactionPooler = Boolean(url?.includes(':6543') || url?.includes('pgbouncer=true'))

  return transactionPooler ? { max: 1, prepare: false, idle_timeout: 20 } : { max: 10 }
}

const globalForDb = globalThis as unknown as { sql?: postgres.Sql }

const sql = globalForDb.sql ?? postgres(env.DATABASE_URL, poolOptions(env.DATABASE_URL))
if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql

export const cache = new MemoryCache()

export const db = drizzle(sql, { schema, casing: 'snake_case', cache })
export type Database = typeof db
export { sql }

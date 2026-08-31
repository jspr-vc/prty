import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import '../load-env'

/**
 * Runs the same migrations `drizzle-kit migrate` does, but reports what went
 * wrong. The CLI exits 1 with the spinner still on the line and no message,
 * which is impossible to act on from a CI log.
 */
async function main() {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'No database URL. Locally, set DIRECT_DATABASE_URL or DATABASE_URL. In CI, ' +
        'add DIRECT_DATABASE_URL (the session-pooler string) as a repository secret.',
    )
  }

  const folder = join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle')
  // Migrations are DDL in one session: never the transaction pooler, and never
  // prepared statements in case the URL points at one anyway.
  const sql = postgres(url, { max: 1, prepare: false })

  try {
    console.log(`applying migrations from ${folder}`)
    await migrate(drizzle(sql), { migrationsFolder: folder })
    console.log('migrations applied')
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  const e = error as { message?: string; cause?: unknown; code?: string; detail?: string }
  console.error('migration failed:', e.message ?? error)
  if (e.code) console.error('  code  :', e.code)
  if (e.detail) console.error('  detail:', e.detail)
  if (e.cause) console.error('  cause :', e.cause)
  process.exit(1)
})

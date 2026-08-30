import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import '../load-env'

interface JournalEntry {
  idx: number
  when: number
  tag: string
}

const here = dirname(fileURLToPath(import.meta.url))
const journalPath = join(here, '..', 'drizzle', 'meta', '_journal.json')

/**
 * drizzle-kit has no "status" command, but its bookkeeping is simple: every
 * applied migration lands one row in drizzle.__drizzle_migrations whose
 * created_at is the journal entry's `when`. Comparing the two tells us what is
 * still outstanding without touching the schema.
 */
async function main() {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
  if (!url) throw new Error('Set DIRECT_DATABASE_URL (or DATABASE_URL) to the target database')

  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as { entries: JournalEntry[] }
  const sql = postgres(url, { max: 1, prepare: false, idle_timeout: 5 })

  try {
    const rows = await sql<{ created_at: string }[]>`
      select created_at from drizzle.__drizzle_migrations
    `.catch(() => [])
    const applied = new Set(rows.map((row) => Number(row.created_at)))

    const pending = journal.entries.filter((entry) => !applied.has(entry.when))
    for (const entry of journal.entries) {
      const mark = applied.has(entry.when) ? 'applied' : 'PENDING'
      console.log(`  ${mark.padEnd(8)} ${entry.tag}`)
    }
    console.log(`\n${journal.entries.length} migration(s) in the repo, ${pending.length} pending.`)

    // The workflow reads this to decide whether an apply is worth running.
    if (process.env.GITHUB_OUTPUT) {
      const fs = await import('node:fs')
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `pending=${pending.length}\n`)
    }
    process.exitCode = 0
  } finally {
    await sql.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

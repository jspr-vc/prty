import type { Database } from 'bun:sqlite'
import { migrations } from './migrations.generated'

/**
 * Applies whatever has not been applied yet, in journal order.
 *
 * Deliberately not drizzle's own migrator: that one reads the `drizzle/` folder
 * off disk, and inside a compiled binary there is no folder. The bookkeeping is
 * one table and a tag comparison, which is little enough to own.
 */
export function migrateToLatest(sqlite: Database): string[] {
  sqlite.run(`
    create table if not exists __migrations (
      tag text primary key,
      applied_at integer not null
    )
  `)

  const applied = new Set(
    (sqlite.query('select tag from __migrations').all() as { tag: string }[]).map((row) => row.tag),
  )

  const pending = migrations.filter((migration) => !applied.has(migration.tag))
  if (pending.length === 0) return []

  // One transaction for the whole run: a half-applied schema is the one state
  // there is no sensible way to recover from on someone's laptop.
  const apply = sqlite.transaction(() => {
    for (const migration of pending) {
      for (const statement of migration.statements) sqlite.run(statement)
      sqlite
        .query('insert into __migrations (tag, applied_at) values (?, ?)')
        .run(migration.tag, Date.now())
    }
  })
  apply()

  return pending.map((migration) => migration.tag)
}

export function migrationStatus(sqlite: Database): { tag: string; applied: boolean }[] {
  sqlite.run(
    'create table if not exists __migrations (tag text primary key, applied_at integer not null)',
  )
  const applied = new Set(
    (sqlite.query('select tag from __migrations').all() as { tag: string }[]).map((row) => row.tag),
  )
  return migrations.map((migration) => ({
    tag: migration.tag,
    applied: applied.has(migration.tag),
  }))
}

import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { databasePath } from './env-db'
import * as schema from './schema'

export function openDatabase(path: string): Database {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const sqlite = new Database(path, { create: true })

  // WAL lets the reads a room full of phones generates run while a host action
  // is being written. `normal` is the matching durability: a power cut can cost
  // the last action, and the alternative is an fsync on every buzz.
  sqlite.run('pragma journal_mode = WAL')
  sqlite.run('pragma synchronous = normal')
  sqlite.run('pragma foreign_keys = on')
  // Nothing should ever be contended — one process, and writes are serialised
  // above this — but a lock that waits beats a lock that throws mid-show.
  sqlite.run('pragma busy_timeout = 5000')
  return sqlite
}

const globalForDb = globalThis as unknown as { sqlite?: Database }

/**
 * `bun --hot` re-evaluates this module on every edit. Without the global, each
 * reload would open the file again and leak both a handle and a WAL reader.
 */
function sharedDatabase(): Database {
  if (!globalForDb.sqlite) globalForDb.sqlite = openDatabase(databasePath())
  return globalForDb.sqlite
}

export const sqlite = sharedDatabase()

export const db = drizzle(sqlite, { schema, casing: 'snake_case' })
export type Database_ = typeof db
export type { Database }

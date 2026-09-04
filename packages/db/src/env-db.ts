import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Where the whole show lives: one SQLite file, plus the `-wal` and `-shm`
 * sidecars WAL mode brings with it.
 *
 * Defaulting under the home directory rather than the working directory matters
 * for the binary — a host who runs it from Downloads one night and from the
 * desktop the next should still find last night's session.
 */
export function databasePath(): string {
  return process.env.GAMESHOWS_DB ?? join(homedir(), '.gameshows', 'gameshows.db')
}

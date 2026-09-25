import { Database } from 'bun:sqlite'
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { databasePath } from '../src/env-db'

const snapshotPath = join(import.meta.dir, '../../../data/gameshows.db')

function snapshot(): void {
  const livePath = databasePath()
  if (!existsSync(livePath)) {
    console.error(`no database at ${livePath}`)
    process.exit(1)
  }

  mkdirSync(dirname(snapshotPath), { recursive: true })
  rmSync(snapshotPath, { force: true })

  // VACUUM INTO reads a consistent copy through WAL, so the server can stay up.
  const live = new Database(livePath)
  live.run('vacuum into ?', [snapshotPath])
  live.close()

  // The narration cache is most of the file and every clip is re-rendered on
  // demand, so it stays out of git. Rollback journal mode leaves a single file.
  const copy = new Database(snapshotPath)
  copy.run('pragma journal_mode = delete')
  copy.run('delete from narration_clip')
  copy.run('vacuum')
  copy.close()

  const kb = Math.round(statSync(snapshotPath).size / 1024)
  console.log(`snapshot: ${relative(process.cwd(), snapshotPath)} (${kb} KB)`)
}

function restore(force: boolean): void {
  const livePath = databasePath()
  if (!existsSync(snapshotPath)) {
    console.error(`no snapshot at ${snapshotPath}`)
    process.exit(1)
  }
  if (existsSync(livePath) && !force) {
    console.error(`${livePath} already exists. Stop the server and pass --force to replace it.`)
    process.exit(1)
  }

  mkdirSync(dirname(livePath), { recursive: true })
  for (const sidecar of ['-wal', '-shm']) rmSync(livePath + sidecar, { force: true })
  copyFileSync(snapshotPath, livePath)
  console.log(`restored: ${livePath}`)
}

const command = process.argv[2]

if (command === 'snapshot') snapshot()
else if (command === 'restore') restore(process.argv.includes('--force'))
else {
  console.error('usage: snapshot.ts <snapshot|restore [--force]>')
  process.exit(1)
}

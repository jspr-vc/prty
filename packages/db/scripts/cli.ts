import { bootstrap } from '../src/bootstrap'
import { db, sqlite } from '../src/client'
import { databasePath } from '../src/env-db'
import { migrationStatus } from '../src/migrate'

const command = process.argv[2]

if (command === 'status') {
  for (const entry of migrationStatus(sqlite)) {
    console.log(`  ${(entry.applied ? 'applied' : 'PENDING').padEnd(8)} ${entry.tag}`)
  }
} else if (command === 'migrate' || command === 'seed') {
  const { applied, hostPin } = bootstrap(sqlite, db)
  console.log(`database: ${databasePath()}`)
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'already up to date')
  console.log(`host pin: ${hostPin}`)
} else {
  console.error('usage: cli.ts <migrate|seed|status>')
  process.exit(1)
}

import { parseArgs } from 'node:util'
import { APP_NAME } from '@workspace/common/consts'
import { databasePath, db, sqlite } from '@workspace/db'
import { bootstrap } from '@workspace/db/bootstrap'
import { hasClientBundle } from './assets'
import { lanAddresses } from './lan'
import { narrateAll } from './narrate'
import { startServer } from './server'
import { capabilities, engineStatus, voicesDirectories, voicesDirectory } from './tts'

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    port: { type: 'string', short: 'p' },
    pin: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
    pack: { type: 'string' },
    voice: { type: 'string' },
    rate: { type: 'string' },
    mode: { type: 'string' },
    regenerate: { type: 'boolean' },
    prune: { type: 'boolean' },
  },
  allowPositionals: true,
})

if (values.help) {
  console.log(`${APP_NAME} — one binary, one room.

  gameshows              Start the server
  gameshows narrate      Render every pack's narration to audio, up front
  gameshows voices       List the speech voices this machine can use

  --port, -p   Port to listen on (default 3000, or GAMESHOWS_PORT)
  --pin        Force the host PIN instead of keeping the stored one
  --help, -h   This

narrate options:
  --pack       Only this pack slug (default: all of them)
  --voice      Voice name, as listed by \`gameshows voices\`
  --rate       Speaking speed as a percentage (default 95, matching a new session)
  --mode       clues | everything (default everything)
  --regenerate Render every line again, replacing what is already cached
  --prune      Then delete this voice's clips for lines no pack has any more

Environment:
  GAMESHOWS_DB       Where the show is stored (default ~/.gameshows/gameshows.db)
  GAMESHOWS_PORT     Same as --port
  GAMESHOWS_PIN      Same as --pin
  GAMESHOWS_VOICES   Extra directory to search for piper voices (.onnx)
  GAMESHOWS_PIPER_BIN  Path to a piper executable, if it is not on PATH
`)
  process.exit(0)
}

const command = positionals[0]

const port = Number(values.port ?? process.env.GAMESHOWS_PORT ?? 3000)
const { applied, hostPin } = bootstrap(sqlite, db, {
  pin: values.pin ?? process.env.GAMESHOWS_PIN,
})

if (command === 'voices') {
  const { engine, voices } = await capabilities()
  console.log(`engine: ${engine ?? 'none installed'}`)
  console.log(`searched: ${voicesDirectories().join(', ')}`)
  if (voices.length === 0) console.log('voices: none found')
  else for (const voice of voices) console.log(`  ${voice.id}  ${voice.name}`)
  process.exit(0)
}

if (command === 'narrate') {
  const mode = values.mode === 'clues' ? 'clues' : 'everything'
  const { code } = await narrateAll({
    pack: values.pack,
    voice: values.voice ?? null,
    rate: Number(values.rate ?? 95),
    mode,
    regenerate: values.regenerate === true,
    prune: values.prune === true,
  })
  process.exit(code)
}

const server = startServer({ port })
const addresses = lanAddresses()

const line = '─'.repeat(52)
console.log(`\n${line}`)
console.log(`  ${APP_NAME} is live`)
console.log(line)
console.log(`  Big screen   http://localhost:${server.port}`)
for (const entry of addresses) {
  const tag = entry.wireless ? 'wifi' : entry.device
  console.log(`               http://${entry.address}:${server.port}  (${tag})`)
}
console.log(`  Host console http://localhost:${server.port}/host`)

if (addresses.length === 0) {
  console.log('\n  ! No LAN address found. Phones will not be able to reach this machine.')
} else {
  // The QR code is built from whatever address the big screen was opened on,
  // so opening the TV on localhost hands every phone a URL only this machine
  // can resolve. This is the single most common way a night fails to start.
  console.log('\n  Open the big screen on one of the LAN addresses above, not')
  console.log('  localhost — the QR code is built from whatever address you use.')
}
console.log(`\n  Host PIN     ${hostPin}`)
console.log(`\n  Database     ${databasePath()}`)
if (applied.length > 0) console.log(`  Migrated     ${applied.join(', ')}`)
console.log(`  Narration    ${engineStatus()}`)
console.log(`  Voices       ${voicesDirectory()}`)
if (!hasClientBundle()) {
  console.log('\n  ! No client bundled — run `bun run build` or use `bun run dev`.')
}
console.log(`${line}\n`)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.stop()
    sqlite.close()
    process.exit(0)
  })
}

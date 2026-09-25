import { Database } from 'bun:sqlite'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Packs piper's rendered clips into `narration/clips.db`, which the next build
 * embeds in the binary. A room laptop then plays piper narration without piper.
 *
 * Only clips with a named voice are taken: with no voice chosen, the TV speaks
 * with its own browser voices whenever it has any and never asks the server.
 * The WAVs are re-encoded to MP3 first, because piper's output for every pack
 * is hundreds of megabytes and the binary has to be downloaded.
 *
 *   bun run scripts/pack-narration.ts <database with rendered clips>
 */
const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'narration', 'clips.db')

const source = process.argv[2]
if (!source) {
  console.error('usage: pack-narration.ts <database with rendered clips>')
  process.exit(1)
}

interface SourceClip {
  id: string
  voice: string
  audio: string
}

const input = new Database(source, { readonly: true })
const clips = input
  .query(
    "select id, voice, audio from narration_clip where engine = 'piper' and voice is not null and mime_type = 'audio/wav'",
  )
  .all() as SourceClip[]
input.close()

if (clips.length === 0) {
  console.error(`no piper clips with a voice in ${source}`)
  process.exit(1)
}

mkdirSync(dirname(out), { recursive: true })
rmSync(out, { force: true })
const packed = new Database(out, { create: true })
packed.run('pragma journal_mode = delete')
packed.run(
  'create table clip (id text primary key, voice text not null, mime_type text not null, audio blob not null)',
)
const insert = packed.prepare('insert into clip (id, voice, mime_type, audio) values (?, ?, ?, ?)')

const scratch = join(tmpdir(), `gameshows-pack-${process.pid}`)
mkdirSync(scratch, { recursive: true })
const wav = join(scratch, 'in.wav')
const mp3 = join(scratch, 'out.mp3')

let done = 0
for (const clip of clips) {
  await Bun.write(wav, Buffer.from(clip.audio, 'base64'))
  // Mono speech at 48 kbps is indistinguishable from the WAV on a TV speaker.
  const proc = Bun.spawnSync(
    ['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '48k', mp3],
    { stderr: 'pipe' },
  )
  if (proc.exitCode !== 0) {
    console.error(`ffmpeg failed on clip ${clip.id}: ${proc.stderr.toString()}`)
    process.exit(1)
  }
  insert.run(clip.id, clip.voice, 'audio/mpeg', new Uint8Array(await Bun.file(mp3).arrayBuffer()))
  done++
  if (done % 100 === 0) console.log(`  ${done}/${clips.length}`)
}

rmSync(scratch, { recursive: true, force: true })
packed.run('vacuum')
const voices = packed.query('select voice, count(*) as n from clip group by voice').all() as {
  voice: string
  n: number
}[]
packed.close()

for (const { voice, n } of voices) console.log(`  ${voice}: ${n} clips`)
const mb = (statSync(out).size / 1024 / 1024).toFixed(1)
console.log(`packed ${clips.length} clip(s) into ${out} (${mb} MB)`)

import type { NarrationMode } from '@workspace/common/consts'
import { shouldNarrate } from '@workspace/common/game'
import { db } from '@workspace/db'
import { getGame } from '@workspace/games'
import {
  cachedClip,
  detectEngine,
  engineClipId,
  pruneClips,
  synthesize,
  voicesDirectory,
} from './tts'

export interface NarrateOptions {
  /** Render only this pack slug. Omitted, every pack is rendered. */
  pack?: string
  voice?: string | null
  /** Must match the session's narration speed: the cache is keyed on it. */
  rate: number
  mode: NarrationMode
  /**
   * Render every line again, replacing what is cached.
   *
   * Normally a cached line is left alone, which is what makes a second run
   * cheap. But a clip can be wrong rather than missing — a pack edited in place
   * under a slug that has already been rendered, a voice model replaced with a
   * better build of itself, a run that was interrupted mid-file — and skipping
   * is then exactly the wrong answer.
   */
  regenerate?: boolean
  /**
   * Afterwards, delete this engine's clips in this voice for lines no pack has
   * any more. A database carried between runs otherwise keeps every edited
   * line's old rendering, and packing it would ship them all. Every pack must
   * be walked for this to know what is current, so it refuses `pack`.
   */
  prune?: boolean
  /**
   * Called after every line, for a caller that is not a terminal.
   *
   * The console runs the same pass as the command line does, and needs the
   * counts rather than the dots.
   */
  onProgress?: (progress: RenderProgress) => void
  /** Suppress the dots and the summary. */
  quiet?: boolean
}

/**
 * How the pass ended. The exit code is what a terminal wants; the message is
 * what the console shows, and the two used to be the same `1` — so a mistyped
 * pack slug and a missing speech engine were indistinguishable to anyone not
 * reading stderr.
 */
export interface NarrateResult {
  code: number
  error?: string
}

export interface RenderProgress {
  done: number
  total: number
  rendered: number
  cached: number
  failed: number
}

/**
 * Renders every line of every pack to audio, up front.
 *
 * Doing this before the night rather than during it is the whole point. A local
 * neural voice takes a moment per line, which is fine at a desk and not fine
 * with a room waiting for the next clue — and pack content never changes, so
 * the work is only ever done once.
 */
export async function narrateAll(options: NarrateOptions): Promise<NarrateResult> {
  const found = detectEngine()
  if (!found) {
    const error = `No speech engine installed. Put a piper voice (.onnx) in ${voicesDirectory()}, or install espeak-ng.`
    if (!options.quiet) console.error(error)
    return { code: 1, error }
  }

  if (options.prune && options.pack) {
    const error = 'Pruning needs every pack rendered, so it cannot be combined with a pack slug.'
    if (!options.quiet) console.error(error)
    return { code: 1, error }
  }

  const packs = await db.query.gamePack.findMany({ with: { game: true } })
  const wanted = options.pack ? packs.filter((pack) => pack.slug === options.pack) : packs

  if (wanted.length === 0) {
    const error = options.pack
      ? `No pack with slug "${options.pack}". Known: ${packs.map((p) => p.slug).join(', ')}`
      : 'No packs in the database.'
    if (!options.quiet) console.error(error)
    return { code: 1, error }
  }

  console.log(
    `engine ${found.engine.name}, voice ${options.voice ?? '(default)'}, rate ${options.rate}%`,
  )
  console.log(
    `mode ${options.mode} — ${wanted.length} pack(s)${options.regenerate ? ', regenerating every line' : ''}\n`,
  )

  let rendered = 0
  let cached = 0
  let failed = 0
  let done = 0
  const current = new Set<string>()
  const started = Date.now()

  // Counted up front so a progress bar has a denominator. The pass itself still
  // walks pack by pack, because that is what the terminal output is shaped
  // around and what a partial failure has to be reported against.
  const total = wanted.reduce((count, pack) => {
    const definition = getGame(pack.game.slug)
    if (!definition?.narrationLines) return count
    const parsed = definition.packSchema.safeParse(pack.content)
    if (!parsed.success) return count
    return (
      count +
      definition.narrationLines(parsed.data).filter((line) => shouldNarrate(line, options.mode))
        .length
    )
  }, 0)

  const write = (text: string) => {
    if (!options.quiet) process.stdout.write(text)
  }

  for (const pack of wanted) {
    const definition = getGame(pack.game.slug)
    if (!definition?.narrationLines) {
      console.log(`${pack.name} — ${pack.game.slug} has no narration, skipping`)
      continue
    }

    const parsed = definition.packSchema.safeParse(pack.content)
    if (!parsed.success) {
      console.error(`${pack.name} — pack does not parse, skipping`)
      failed++
      continue
    }

    const lines = definition
      .narrationLines(parsed.data)
      .filter((line) => shouldNarrate(line, options.mode))

    write(`${pack.name} (${lines.length} lines) `)

    for (const line of lines) {
      const id = engineClipId(options.voice ?? null, options.rate, line.text)
      if (id) current.add(id)
      if (!options.regenerate && cachedClip(options.voice ?? null, options.rate, line.text)) {
        cached++
        write('·')
      } else {
        const clip = await synthesize(
          line.text,
          options.voice ?? null,
          options.rate,
          options.regenerate,
        )
        if (clip) {
          rendered++
          write('#')
        } else {
          failed++
          write('!')
        }
      }
      done++
      options.onProgress?.({ done, total, rendered, cached, failed })
    }
    write('\n')
  }

  // Only after a clean pass: a pack that failed to parse contributed no ids,
  // and pruning then would delete its clips.
  const pruned = options.prune && failed === 0 ? pruneClips(options.voice ?? null, current) : 0

  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  const skipped = options.regenerate ? 'none skipped' : `${cached} already cached`
  if (!options.quiet) {
    console.log(`\n${rendered} rendered, ${skipped}, ${failed} failed — ${seconds}s`)
    if (options.prune) console.log(`${pruned} stale clip(s) pruned`)
    if (failed > 0) console.log('A "!" is a line the engine refused; re-run to retry just those.')
    console.log(
      `\nSet the same voice and speed (${options.rate}%) on the night, or the TV will ask for` +
        ' clips that were never rendered and fall back to synthesising them live.',
    )
  }
  return {
    code: failed > 0 ? 1 : 0,
    error: failed > 0 ? `${failed} line(s) the engine refused` : undefined,
  }
}

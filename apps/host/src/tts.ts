import { createHash } from 'node:crypto'
import { existsSync, readdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { and, db, eq, isNull } from '@workspace/db'
import { narrationClip } from '@workspace/db/schema'
import { ESPEAK_WASM_VOICES, synthesizeWithWasm } from './espeak-wasm'
import { NARRATION } from './narration.generated'

/**
 * Narration has two halves. The TV speaks with `speechSynthesis` when the
 * browser has voices, which is the good path: nothing crosses the network, and
 * the voice is whichever one the host already likes on that machine.
 *
 * This is the other half. Some TV browsers ship no voices at all — on Linux
 * they come from speech-dispatcher, which is not always installed — so the
 * server keeps a local speech engine in reserve and renders the line itself.
 *
 * Engines are tried in quality order. Piper is a neural model and sounds like a
 * person; espeak sounds like 1985. Both are entirely offline.
 */

/**
 * Where Piper voice models (`.onnx`) are looked for, in order.
 *
 * The system paths are here because distributions package these voices, and a
 * host who installs one should not then have to work out where it went and copy
 * it somewhere else. The home directory still wins, so a hand-placed voice
 * overrides a packaged one.
 */
export function voicesDirectories(): string[] {
  const configured = process.env.GAMESHOWS_VOICES
  return [
    ...(configured ? [configured] : []),
    join(homedir(), '.gameshows', 'voices'),
    '/usr/share/piper-voices',
    '/usr/local/share/piper-voices',
  ]
}

/** The first directory that actually exists, for the banner to name. */
export function voicesDirectory(): string {
  return voicesDirectories().find((dir) => existsSync(dir)) ?? voicesDirectories()[0] ?? ''
}

/**
 * Packaged voices are filed by language and quality
 * (`…/en/en_US/lessac/medium/en_US-lessac-medium.onnx`), so the search has to
 * descend. The depth cap keeps a misconfigured path from walking a whole disk.
 */
function findModels(dir: string, depth = 0): { name: string; path: string }[] {
  if (depth > 5) return []
  let entries: import('node:fs').Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const found: { name: string; path: string }[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...findModels(full, depth + 1))
    else if (entry.name.endsWith('.onnx'))
      found.push({ name: basename(entry.name, '.onnx'), path: full })
  }
  return found
}

function piperModels(): { name: string; path: string }[] {
  const explicit = process.env.GAMESHOWS_PIPER_MODEL
  if (explicit) return [{ name: basename(explicit, '.onnx'), path: explicit }]

  const byName = new Map<string, { name: string; path: string }>()
  for (const dir of voicesDirectories()) {
    // Earlier directories win, so a hand-placed voice beats a packaged one.
    for (const model of findModels(dir)) if (!byName.has(model.name)) byName.set(model.name, model)
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * A voice as the host sees it and as the engine wants it.
 *
 * The two are not the same string, which is the whole reason this is a pair.
 * `espeak-ng --voices` prints a language code and a display name, and only the
 * code is reliably accepted back by `-v`: a third of the display names are
 * rejected outright, English's among them. Offering the pretty one and sending
 * it back was a dropdown full of voices that could not speak.
 */
export interface Voice {
  /** What `-v` is given. */
  id: string
  /** What the host reads. */
  name: string
}

interface EngineBase {
  /** Display name, and part of the cache key — stable across binary names. */
  name: string
  voices(binary: string): Promise<Voice[]>
}

/** An engine that is a program on this machine. */
interface SpawnEngine extends EngineBase {
  kind: 'spawn'
  /**
   * Executables to look for, in order. Distributions do not agree on what to
   * call these: Arch ships Piper as `piper-tts`, upstream releases call it
   * `piper`. The cache key stays `name` either way, so clips survive a rename.
   */
  binaries: string[]
  /** argv that writes a wav to `out`. Never a shell string: the text is content. */
  command(binary: string, text: string, out: string, voice: string | null, rate: number): string[]
  /** Piper takes its text on stdin; the others take it as an argument. */
  stdin: boolean
}

/**
 * An engine that is carried inside this executable, and so is always here.
 * It renders to bytes rather than to a file: there is no process to hand a
 * path to.
 */
interface BuiltInEngine extends EngineBase {
  kind: 'built-in'
  synthesize(text: string, voice: string | null, rate: number): Promise<Uint8Array>
}

type Engine = SpawnEngine | BuiltInEngine

/** What `binary` says for an engine that is not a program. */
const BUILT_IN = 'built in'

/** The default speaking rate espeak and say both use, in words per minute. */
const BASE_WPM = 175

/**
 * A binary that is installed but cannot start. Piper is packaged as a Python
 * wrapper around onnxruntime on several distributions, and an onnxruntime built
 * against different shared libraries than the ones on the machine fails at
 * import — long before it looks at its arguments. The binary is on PATH, the
 * voices are in place, and every render dies the same way.
 *
 * That is worth spotting up front rather than per line: an engine that cannot
 * start must not be selected over one that works.
 */
const CANNOT_START =
  /Traceback \(most recent call last\)|ImportError|ModuleNotFoundError|error while loading shared libraries|Symbol not found/

/**
 * Piper's flag spelling drifts between the C++ releases and the Python package
 * (`--length_scale` vs `--length-scale`), so it is probed once rather than
 * guessed. `-m` and `-f` are short flags both accept, so only the rate needs
 * asking about — and if neither spelling is there, the rate is simply dropped
 * rather than failing the render.
 *
 * The same `--help` run answers whether the thing runs at all. It is spawned
 * synchronously because engine selection is synchronous: the banner and the
 * cache lookup both ask which engine is in play before anything is awaited.
 */
interface PiperProbe {
  ok: boolean
  length: string | null
  cuda: boolean
}

let piperProbe: PiperProbe | undefined

function probePiper(binary: string): PiperProbe {
  if (piperProbe) return piperProbe
  let help = ''
  let ok = false
  try {
    const proc = Bun.spawnSync([binary, '--help'], { stdout: 'pipe', stderr: 'pipe' })
    help = `${proc.stdout.toString()}${proc.stderr.toString()}`
    // Not the exit code: builds disagree about what `--help` returns. A broken
    // interpreter announces itself in the output, and a working piper never
    // prints any of it.
    ok = !CANNOT_START.test(help)
  } catch {
    // Leave `help` empty: every probe below then answers "not supported".
  }
  piperProbe = {
    ok,
    length: help.includes('--length_scale')
      ? '--length_scale'
      : help.includes('--length-scale')
        ? '--length-scale'
        : null,
    cuda: help.includes('--cuda'),
  }
  return piperProbe
}

const ENGINES: Engine[] = [
  {
    kind: 'spawn',
    name: 'piper',
    binaries: ['piper', 'piper-tts'],
    stdin: true,
    command: (binary, _text, out, voice, rate) => {
      const models = piperModels()
      const chosen = models.find((model) => model.name === voice) ?? models[0]
      const args = [binary, '-m', chosen?.path ?? '', '-f', out]
      // Piper scales duration, not speed, so the relationship inverts: a longer
      // length scale is slower speech.
      if (piperProbe?.length) args.push(piperProbe.length, (100 / rate).toFixed(3))
      if (piperProbe?.cuda && process.env.GAMESHOWS_PIPER_CUDA === '1') args.push('--cuda')
      return args
    },
    voices: async () => piperModels().map((model) => ({ id: model.name, name: model.name })),
  },
  {
    kind: 'spawn',
    name: 'say',
    binaries: ['say'],
    stdin: false,
    command: (binary, text, out, voice, rate) => [
      binary,
      ...(voice ? ['-v', voice] : []),
      '-r',
      String(Math.round((BASE_WPM * rate) / 100)),
      '-o',
      out,
      '--data-format=LEI16@22050',
      text,
    ],
    // `say -v ?` prints the name that `-v` takes, so the two columns are one.
    voices: async (binary) => listed([binary, '-v', '?'], 0, 0),
  },
  {
    kind: 'spawn',
    name: 'espeak-ng',
    binaries: ['espeak-ng'],
    stdin: false,
    command: (binary, text, out, voice, rate) => espeakArgs(binary, text, out, voice, rate),
    voices: async (binary) => listed([binary, '--voices'], 1, 3),
  },
  {
    kind: 'spawn',
    name: 'espeak',
    binaries: ['espeak'],
    stdin: false,
    command: (binary, text, out, voice, rate) => espeakArgs(binary, text, out, voice, rate),
    voices: async (binary) => listed([binary, '--voices'], 1, 3),
  },
  // Last, and the only one that is always here. An installed engine is better
  // than a bundled one — piper sounds like a person, and a system espeak is the
  // same code with every language's dictionary rather than just English — but
  // this is what keeps the bottom of the ladder from being silence.
  {
    kind: 'built-in',
    name: 'espeak-wasm',
    synthesize: synthesizeWithWasm,
    voices: async () => ESPEAK_WASM_VOICES.map((voice) => ({ ...voice })),
  },
]

function espeakArgs(
  binary: string,
  text: string,
  out: string,
  voice: string | null,
  rate: number,
): string[] {
  return [
    binary,
    ...(voice ? ['-v', voice] : []),
    '-s',
    String(Math.round((BASE_WPM * rate) / 100)),
    '-w',
    out,
    text,
  ]
}

/** Runs a `--voices`-style command and pulls two columns out of its table. */
async function listed(argv: string[], idColumn: number, nameColumn: number): Promise<Voice[]> {
  try {
    const proc = Bun.spawn(argv, { stdout: 'pipe', stderr: 'ignore' })
    const output = await new Response(proc.stdout).text()
    const voices = new Map<string, Voice>()
    for (const line of output.split('\n').slice(1)) {
      const columns = line.trim().split(/\s{2,}|\s/)
      const id = columns[idColumn]
      if (!id) continue
      // espeak writes its names with underscores for the columns' sake.
      const name = (columns[nameColumn] ?? id).replaceAll('_', ' ')
      if (!voices.has(id)) voices.set(id, { id, name })
    }
    return [...voices.values()].slice(0, 200)
  } catch {
    return []
  }
}

export interface ResolvedEngine {
  engine: Engine
  /** The executable that was actually found. */
  binary: string
}

let detected: ResolvedEngine | null | undefined

/**
 * Engines that were selected and then failed to render anything.
 *
 * A binary can pass every check the selection makes and still die on its first
 * line — a model the runtime cannot load, a library that is only reached on the
 * synthesis path. Rather than failing the same way for every clue of the night,
 * the engine is struck off and the next one down takes over. Only an engine
 * that has never produced audio is demoted: one that worked and then hiccuped
 * on a single line keeps its place.
 */
const unusable = new Set<string>()
const proven = new Set<string>()

/**
 * Engine-and-voice pairs the engine refused.
 *
 * A voice it does not have is bad input, not a broken engine, and the two used
 * to be told apart by nothing at all: the first clue of the night rendered with
 * a voice espeak did not recognise struck espeak off for the rest of the run.
 * A rejected voice now costs one wasted render, after which that pairing is
 * rendered in the engine's default voice instead.
 */
const rejectedVoices = new Set<string>()

const voiceKey = (engine: string, voice: string) => `${engine}|${voice}`

function findBinary(engine: Engine): string | null {
  if (engine.kind === 'built-in') return BUILT_IN

  // An explicit path wins, and is the escape hatch when the distribution's
  // build is unusable — a self-contained upstream release bundles its own
  // onnxruntime and so does not care what the system's libraries are doing.
  //
  // Checked for existence rather than trusted: a typo'd path would otherwise
  // report the engine as available and only fail once a render was underway,
  // which is the worst moment to discover it.
  const override = engine.name === 'piper' ? process.env.GAMESHOWS_PIPER_BIN : undefined
  if (override) return existsSync(override) ? override : null

  for (const candidate of engine.binaries) {
    if (Bun.which(candidate) !== null) return candidate
  }
  return null
}

/**
 * The best engine actually installed, or null. Probed once.
 *
 * Piper only counts when it has a voice model to work with: the binary alone
 * cannot say anything, and silently picking it over espeak would turn working
 * narration into silence.
 */
export function detectEngine(): ResolvedEngine | null {
  if (detected !== undefined) return detected
  detected = availableEngines()[0] ?? null
  return detected
}

/** Every usable engine, best first, so a render can fall down the list. */
function availableEngines(): ResolvedEngine[] {
  const found: ResolvedEngine[] = []
  for (const engine of ENGINES) {
    if (unusable.has(engine.name)) continue
    const binary = findBinary(engine)
    if (!binary) continue
    // Piper only counts when it has a voice model *and* actually starts.
    if (engine.name === 'piper' && (piperModels().length === 0 || !probePiper(binary).ok)) continue
    found.push({ engine, binary })
  }
  return found
}

function demote(name: string, reason: string): void {
  unusable.add(name)
  // Force reselection: the banner's engine is now the next one down.
  detected = undefined
  const next = detectEngine()
  console.error(
    `tts: ${name} failed and is being skipped for the rest of this run — ${reason.trim().split('\n')[0] ?? ''}`,
  )
  console.error(`tts: narration now ${next ? `using ${next.engine.name}` : 'unavailable'}`)
}

/** Why narration is silent, when it is, in words the banner can print. */
export function engineStatus(): string {
  const found = detectEngine()
  if (found) return `${found.engine.name} via ${found.binary}`

  const piper = ENGINES.find((engine) => engine.name === 'piper')
  // Reached only when something above the built-in engine is broken rather than
  // absent, since the built-in one is always available.
  const piperBinary = piper ? findBinary(piper) : null
  if (piperBinary) {
    if (!probePiper(piperBinary).ok) return `piper installed but cannot start (${piperBinary})`
    if (piperModels().length === 0) {
      return `piper found but no voices in ${voicesDirectories().join(', ')}`
    }
  }
  return 'browser voices only'
}

export interface TtsCapabilities {
  engine: string | null
  voices: Voice[]
  /**
   * The banner's sentence, sent to the console as well.
   *
   * An empty voice list is the same shape whether nothing is installed, piper
   * has no model, or piper is installed and cannot start — and the host staring
   * at a dropdown with no server voices in it has no way to tell which.
   */
  status: string
}

export async function capabilities(): Promise<TtsCapabilities> {
  const status = engineStatus()
  const found = detectEngine()
  const installed = found ? await found.engine.voices(found.binary) : []
  // A built-in voice has to be offered by name: with no voice chosen, the TV
  // uses its own browser voices and never asks for the clips.
  const builtIn = builtInVoices()
    .filter((voice) => !installed.some((entry) => entry.id === voice))
    .map((voice) => ({ id: voice, name: `${voice} (built in)` }))
  return { engine: found?.engine.name ?? null, voices: [...installed, ...builtIn], status }
}

let builtInVoiceList: string[] | undefined

/** Voices piper rendered when the binary was built, playable with no engine installed. */
function builtInVoices(): string[] {
  if (!NARRATION) return []
  builtInVoiceList ??= (
    NARRATION.query('select distinct voice from clip order by voice').all() as { voice: string }[]
  ).map((row) => row.voice)
  return builtInVoiceList
}

function findBuiltInClip(id: string): Clip | null {
  if (!NARRATION) return null
  const row = NARRATION.query('select mime_type, audio from clip where id = ?').get(id) as {
    mime_type: string
    audio: Uint8Array
  } | null
  if (!row) return null
  const bytes = row.audio.buffer.slice(
    row.audio.byteOffset,
    row.audio.byteOffset + row.audio.byteLength,
  ) as ArrayBuffer
  return { mimeType: row.mime_type, bytes }
}

const MAX_TEXT_LENGTH = 1200

function clipId(engine: string, voice: string | null, rate: number, text: string): string {
  return createHash('sha256')
    .update(`${engine}|${voice ?? ''}|${rate}|${text}`)
    .digest('hex')
}

export interface Clip {
  mimeType: string
  bytes: ArrayBuffer
}

/**
 * Whether this exact line is already rendered, without rendering it.
 *
 * The pre-render pass uses this to tell "already done" from "just done", which
 * is the difference between a progress bar that means something and one that
 * always claims to have worked.
 */
/**
 * A clip already rendered, whichever engine rendered it.
 *
 * The engine is part of the cache key, so asking as espeak never finds what
 * piper made — and asking with no engine at all found nothing, which meant a
 * server started without its engine served 503s while ninety megabytes of
 * perfectly good audio sat in the database. Rendering and playback are
 * genuinely separate jobs: a pack can be rendered on a machine that has piper
 * and played on one that does not.
 */
export function findCachedClip(
  voice: string | null,
  ratePercent: number,
  text: string,
): Clip | null {
  const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH)
  if (!trimmed) return null
  const rate = Math.max(50, Math.min(150, Math.round(ratePercent)))

  // The installed engine first, so its own rendering wins when several exist.
  const names = [detectEngine()?.engine.name, ...ENGINES.map((engine) => engine.name)]
  for (const name of new Set(names.filter(Boolean) as string[])) {
    const row = db
      .select()
      .from(narrationClip)
      .where(eq(narrationClip.id, clipId(name, voice, rate, trimmed)))
      .get()
    if (row) return { mimeType: row.mimeType, bytes: decode(row.audio) }
  }
  // After the database, so a line the host re-rendered locally wins.
  for (const name of new Set(names.filter(Boolean) as string[])) {
    const clip = findBuiltInClip(clipId(name, voice, rate, trimmed))
    if (clip) return clip
  }
  return null
}

/** The id *this* engine would store a line under, or null with no engine. */
export function engineClipId(
  voice: string | null,
  ratePercent: number,
  text: string,
): string | null {
  const found = detectEngine()
  if (!found) return null
  const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH)
  const rate = Math.max(50, Math.min(150, Math.round(ratePercent)))
  return clipId(found.engine.name, voice, rate, trimmed)
}

/** Whether *this* engine has already rendered a line, for the pre-render's progress. */
export function cachedClip(voice: string | null, ratePercent: number, text: string): boolean {
  const id = engineClipId(voice, ratePercent, text)
  if (!id) return false
  return (
    db
      .select({ id: narrationClip.id })
      .from(narrationClip)
      .where(eq(narrationClip.id, id))
      .get() !== undefined
  )
}

/**
 * Deletes this engine's clips in a voice that are not in `keep`, and returns how
 * many went. Every rate goes: the ids hash the rate, so there is no column to
 * scope by.
 */
export function pruneClips(voice: string | null, keep: Set<string>): number {
  const found = detectEngine()
  if (!found) return 0
  const stale = db
    .select({ id: narrationClip.id })
    .from(narrationClip)
    .where(
      and(
        eq(narrationClip.engine, found.engine.name),
        voice === null ? isNull(narrationClip.voice) : eq(narrationClip.voice, voice),
      ),
    )
    .all()
    .filter((row) => !keep.has(row.id))
  db.transaction((tx) => {
    for (const row of stale) tx.delete(narrationClip).where(eq(narrationClip.id, row.id)).run()
  })
  return stale.length
}

function decode(base64: string): ArrayBuffer {
  const buffer = Buffer.from(base64, 'base64')
  // Node pools small buffers, so the backing store is usually shared with
  // unrelated data. Slice to the view's own bytes before handing it out.
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer
}

/**
 * Renders a line, or returns a cached rendering.
 *
 * Cached in the database rather than beside it: the whole show is already one
 * file the host can delete, and a second cache directory is a second thing to
 * explain. Pack content never changes, so a clue is rendered once and replayed
 * for the life of the file — which is what makes a slow or metered engine
 * perfectly usable here.
 */
export async function synthesize(
  text: string,
  voice: string | null,
  ratePercent: number,
  /** Render again even if this line is already cached, and replace it. */
  regenerate = false,
): Promise<Clip | null> {
  const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH)
  if (!trimmed) return null
  const rate = Math.max(50, Math.min(150, Math.round(ratePercent)))

  // Cache first, and before requiring an engine: playing back what was already
  // rendered must not depend on still being able to render.
  const cached = regenerate ? null : findCachedClip(voice, rate, trimmed)
  if (cached) return cached

  // Down the list rather than at the first engine: one that is installed can
  // still fail on its first render, and the room would rather hear espeak than
  // nothing at all.
  for (const resolved of availableEngines()) {
    const clip = await render(resolved, trimmed, voice, rate)
    if (clip) return clip
  }
  return null
}

/**
 * Caches a rendering and hands back the clip it just wrote.
 *
 * The write replaces rather than yields, because the only way to reach it is to
 * have rendered the line: either nothing was cached, or the caller asked for
 * this exact line to be done again and would not thank us for keeping the old
 * one.
 */
function store(
  id: string,
  engine: string,
  voice: string | null,
  text: string,
  rendered: Uint8Array,
): Clip {
  const audio = Buffer.from(rendered).toString('base64')
  db.insert(narrationClip)
    .values({ id, engine, voice, text, mimeType: 'audio/wav', audio })
    .onConflictDoUpdate({ target: narrationClip.id, set: { mimeType: 'audio/wav', audio } })
    .run()

  const bytes = rendered.buffer.slice(
    rendered.byteOffset,
    rendered.byteOffset + rendered.byteLength,
  ) as ArrayBuffer
  return { mimeType: 'audio/wav', bytes }
}

async function render(
  resolved: ResolvedEngine,
  trimmed: string,
  requested: string | null,
  rate: number,
): Promise<Clip | null> {
  const { engine } = resolved
  // Known to be refused, so do not spend a process finding out again.
  const known = requested && rejectedVoices.has(voiceKey(engine.name, requested))
  // A first render in a voice the host chose is not evidence about the engine:
  // the voice is far more likely to be the thing that is wrong.
  const clip = await attempt(resolved, trimmed, known ? null : requested, rate, known || !requested)
  if (clip || !requested || known) return clip

  // The engine said no. If it says yes to the same line in its default voice,
  // the voice was the problem and the engine is fine — so the room hears the
  // clue in the wrong accent rather than not at all.
  const fallback = await attempt(resolved, trimmed, null, rate, true)
  if (fallback) rejectedVoices.add(voiceKey(engine.name, requested))
  return fallback
}

async function attempt(
  { engine, binary }: ResolvedEngine,
  trimmed: string,
  voice: string | null,
  rate: number,
  /** Whether failing here is the engine's fault, and so worth striking it off. */
  mayDemote: boolean,
): Promise<Clip | null> {
  const id = clipId(engine.name, voice, rate, trimmed)

  if (engine.name === 'piper') probePiper(binary)

  const failed = (reason: string): null => {
    if (mayDemote && !proven.has(engine.name)) demote(engine.name, reason)
    else console.error(`tts: ${engine.name} ${reason}`)
    return null
  }

  if (engine.kind === 'built-in') {
    try {
      const rendered = await engine.synthesize(trimmed, voice, rate)
      if (rendered.byteLength === 0) return failed('produced no audio')
      proven.add(engine.name)
      return store(id, engine.name, voice, trimmed, rendered)
    } catch (error) {
      return failed(String(error))
    }
  }

  const out = join(tmpdir(), `gameshows-tts-${id.slice(0, 16)}.wav`)
  try {
    const proc = Bun.spawn(engine.command(binary, trimmed, out, voice, rate), {
      stdin: engine.stdin ? new TextEncoder().encode(trimmed) : 'ignore',
      stdout: 'ignore',
      stderr: 'pipe',
    })
    const code = await proc.exited
    if (code !== 0) {
      return failed(`exited ${code}: ${(await new Response(proc.stderr).text()).trim()}`)
    }

    const bytes = await Bun.file(out).arrayBuffer()
    if (bytes.byteLength === 0) return failed('produced an empty file')

    proven.add(engine.name)
    return store(id, engine.name, voice, trimmed, new Uint8Array(bytes))
  } catch (error) {
    return failed(String(error))
  } finally {
    await unlink(out).catch(() => undefined)
  }
}

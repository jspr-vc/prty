import { HOST_PIN_HEADER } from '@workspace/common/consts'
/**
 * A server voice: `id` is what the engine is given, `name` is what the host
 * reads. They are different strings, and sending the readable one back is how
 * a dropdown full of voices ends up unable to speak.
 */
export interface Voice {
  id: string
  name: string
}

export interface TtsCapabilities {
  engine: string | null
  voices: Voice[]
  /** Why the server can or cannot speak, in the same words the banner prints. */
  status: string
}

/**
 * Narration has two paths and prefers the first.
 *
 * `speechSynthesis` is better when it works: nothing crosses the network, and
 * the voice is whichever one the host already likes on that machine. But some
 * TV browsers ship no voices at all, so the server keeps a local speech engine
 * in reserve and renders the line to a wav instead.
 */
function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null
}

/**
 * Chrome populates the voice list asynchronously and reports an empty array on
 * the first call, so a naive check falls back to the server for the first clue
 * of every night and then never again. Wait for `voiceschanged` — briefly.
 */
const VOICE_WAIT_MS = 1500
let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null

export function browserVoices(): Promise<SpeechSynthesisVoice[]> {
  const speech = synth()
  if (!speech) return Promise.resolve([])

  voicesReady ??= new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const existing = speech.getVoices()
    if (existing.length > 0) {
      resolve(existing)
      return
    }
    const done = () => {
      clearTimeout(timer)
      speech.removeEventListener('voiceschanged', onChange)
    }
    const onChange = () => {
      const voices = speech.getVoices()
      if (voices.length === 0) return
      done()
      resolve(voices)
    }
    const timer = setTimeout(() => {
      done()
      resolve(speech.getVoices())
    }, VOICE_WAIT_MS)
    speech.addEventListener('voiceschanged', onChange)
  })

  return voicesReady
}

let capabilities: Promise<TtsCapabilities> | null = null

export function ttsCapabilities(): Promise<TtsCapabilities> {
  capabilities ??= fetch('/api/tts/capabilities')
    .then((response) =>
      response.ok ? response.json() : { engine: null, voices: [], status: 'unavailable' },
    )
    .catch(() => ({ engine: null, voices: [], status: 'unavailable' }) as TtsCapabilities)
  return capabilities
}

/** The server's pre-render job, as the console sees it. */
export interface RenderJob {
  running: boolean
  done: number
  total: number
  rendered: number
  cached: number
  failed: number
  error: string | null
  pack: string | null
  regenerate: boolean
}

export async function renderStatus(): Promise<RenderJob | null> {
  try {
    const response = await fetch('/api/narration/render')
    return response.ok ? ((await response.json()) as RenderJob) : null
  } catch {
    return null
  }
}

/**
 * Re-renders one line, replacing the clip the server has stored for it.
 *
 * Host-only on the server side, so the PIN goes with it. This is the small
 * version of the pre-render: the line on the board sounded wrong, do that one
 * again rather than the whole pack.
 */
export async function regenerateLine(
  text: string,
  { rate, voice }: NarrationOptions,
  pin: string | null,
): Promise<boolean> {
  const params = new URLSearchParams({ text, rate: String(rate), regenerate: '1' })
  if (voice) params.set('voice', voice)
  try {
    const response = await fetch(`/api/tts?${params.toString()}`, {
      headers: pin ? { [HOST_PIN_HEADER]: pin } : {},
    })
    return response.ok
  } catch {
    return false
  }
}

export interface StartRenderInput {
  pack?: string
  voice: string | null
  rate: number
  mode: string
  regenerate: boolean
}

/**
 * Kicks off a pre-render and hands back the job it started.
 *
 * Not tRPC: the renderer lives in the host binary beside the speech engine,
 * which `packages/api` cannot import — the dependency runs the other way.
 */
export async function startRender(
  input: StartRenderInput,
  pin: string | null,
): Promise<RenderJob | null> {
  try {
    const response = await fetch('/api/narration/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(pin ? { [HOST_PIN_HEADER]: pin } : {}),
      },
      body: JSON.stringify(input),
    })
    return response.ok ? ((await response.json()) as RenderJob) : null
  } catch {
    return null
  }
}

let playing: HTMLAudioElement | null = null

export function stopNarration(): void {
  synth()?.cancel()
  if (playing) {
    playing.pause()
    playing = null
  }
}

export interface NarrationOptions {
  /** Percent of the voice's natural speed. */
  rate: number
  voice: string | null
  /**
   * Skip the browser's copy of this clip.
   *
   * `/api/tts` is cached for a day, which is right for a clue whose audio never
   * changes and wrong the one time it did. Only a re-render sets this.
   */
  fresh?: boolean
}

export async function narrate(
  text: string,
  { rate, voice, fresh }: NarrationOptions,
): Promise<void> {
  // Whatever was being said belongs to a clue that is no longer on screen.
  stopNarration()

  const speech = synth()
  const voices = await browserVoices()
  const chosen = voice ? voices.find((entry) => entry.name === voice) : undefined

  // A voice the host picked that this browser does not have is a server voice,
  // and going to the server is precisely what they asked for — speaking it in
  // some arbitrary local voice instead would ignore the choice.
  const browserCanHonourIt = voices.length > 0 && (!voice || chosen !== undefined)

  if (speech && browserCanHonourIt) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = Math.max(0.5, Math.min(1.5, rate / 100))
    if (chosen) utterance.voice = chosen
    speech.speak(utterance)
    return
  }

  // No engine still means pre-rendered clips may exist, and the endpoint serves
  // those without one — so ask regardless and let a 503 be the answer.

  const params = new URLSearchParams({ text, rate: String(rate) })
  if (voice) params.set('voice', voice)
  // A different URL, so the browser fetches rather than replaying what it kept.
  if (fresh) params.set('t', String(Date.now()))
  const audio = new Audio(`/api/tts?${params.toString()}`)
  playing = audio
  // A TV that has not been touched yet is not allowed to play audio. That is
  // browser policy, and `SoundUnlock` is what resolves it; until then, quiet.
  await audio.play().catch(() => undefined)
}

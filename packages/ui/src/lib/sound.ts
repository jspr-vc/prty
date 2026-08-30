/**
 * Every cue is synthesised with the Web Audio API rather than loaded from a
 * file: no binary assets in the repo, nothing to fetch over the network, and
 * the whole set stays tweakable in one place.
 */

export type Cue =
  | 'buzz'
  | 'correct'
  | 'wrong'
  | 'strike'
  | 'reveal'
  | 'clue'
  | 'dailyDouble'
  | 'roundWin'
  | 'start'
  | 'finish'

type Wave = OscillatorType

interface Tone {
  freq: number
  /** Seconds from the start of the cue. */
  at: number
  duration: number
  wave?: Wave
  gain?: number
  /** Slide to this frequency over the tone's duration. */
  slideTo?: number
  /**
   * Hold at full level and release at the end instead of decaying throughout.
   * A buzzer sustains; a chime rings out.
   */
  hold?: boolean
  /**
   * Amplitude modulation in Hz. This is what separates a rasping buzzer from a
   * plain beep — the ear hears the chopping, not the pitch.
   */
  tremoloHz?: number
  tremoloDepth?: number
}

const CUES: Record<Cue, Tone[]> = {
  // A proper game-show buzzer: low, harsh and sustained, two octaves chopped by
  // the same tremolo so they rasp together rather than beat against each other.
  buzz: [
    {
      freq: 196,
      at: 0,
      duration: 0.75,
      wave: 'sawtooth',
      gain: 0.26,
      hold: true,
      tremoloHz: 28,
      tremoloDepth: 0.75,
    },
    {
      freq: 98,
      at: 0,
      duration: 0.75,
      wave: 'square',
      gain: 0.16,
      hold: true,
      tremoloHz: 28,
      tremoloDepth: 0.75,
    },
  ],
  correct: [
    { freq: 660, at: 0, duration: 0.14, gain: 0.26 },
    { freq: 990, at: 0.11, duration: 0.3, gain: 0.26 },
  ],
  wrong: [{ freq: 220, at: 0, duration: 0.36, wave: 'sawtooth', gain: 0.22, slideTo: 110 }],
  // The strike is Family Feud's signature sound and has to cut through a room
  // of people shouting. Lower and slower than the buzz-in so the two never get
  // confused, with a downward slide to land as "wrong".
  strike: [
    {
      freq: 140,
      at: 0,
      duration: 0.55,
      wave: 'sawtooth',
      gain: 0.3,
      slideTo: 110,
      hold: true,
      tremoloHz: 17,
      tremoloDepth: 0.8,
    },
    {
      freq: 70,
      at: 0,
      duration: 0.55,
      wave: 'square',
      gain: 0.2,
      slideTo: 55,
      hold: true,
      tremoloHz: 17,
      tremoloDepth: 0.8,
    },
  ],
  // A bell, not a blip: this is the "that's up there!" moment in both games.
  reveal: [
    { freq: 880, at: 0, duration: 0.5, gain: 0.26 },
    { freq: 1320, at: 0.02, duration: 0.45, gain: 0.17 },
    { freq: 1760, at: 0.04, duration: 0.3, gain: 0.09 },
  ],
  clue: [{ freq: 300, at: 0, duration: 0.16, slideTo: 620, gain: 0.18 }],
  dailyDouble: [
    { freq: 523, at: 0, duration: 0.12 },
    { freq: 659, at: 0.1, duration: 0.12 },
    { freq: 784, at: 0.2, duration: 0.12 },
    { freq: 1047, at: 0.3, duration: 0.34 },
  ],
  roundWin: [
    { freq: 523, at: 0, duration: 0.12, gain: 0.26 },
    { freq: 659, at: 0.1, duration: 0.12, gain: 0.26 },
    { freq: 784, at: 0.2, duration: 0.12, gain: 0.26 },
    { freq: 1047, at: 0.3, duration: 0.4, gain: 0.3 },
  ],
  start: [
    { freq: 392, at: 0, duration: 0.16, gain: 0.26 },
    { freq: 587, at: 0.15, duration: 0.34, gain: 0.28 },
  ],
  finish: [
    { freq: 784, at: 0, duration: 0.14 },
    { freq: 587, at: 0.14, duration: 0.14 },
    { freq: 392, at: 0.28, duration: 0.4 },
  ],
}

let context: AudioContext | undefined
let enabled = false

function getContext(): AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  const Ctor =
    window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return undefined
  context ??= new Ctor()
  return context
}

/**
 * Browsers refuse to start audio without a gesture, so the page has to call
 * this from a real click before any cue will be heard.
 */
export async function enableSound(): Promise<boolean> {
  const ctx = getContext()
  if (!ctx) return false
  try {
    await ctx.resume()
    enabled = ctx.state === 'running'
    return enabled
  } catch {
    return false
  }
}

export function disableSound(): void {
  enabled = false
}

export function isSoundEnabled(): boolean {
  return enabled
}

export function play(cue: Cue): void {
  if (!enabled) return
  const ctx = getContext()
  if (ctx?.state !== 'running') return

  const now = ctx.currentTime
  for (const tone of CUES[cue]) {
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    const start = now + tone.at
    const end = start + tone.duration
    const peak = tone.gain ?? 0.2

    osc.type = tone.wave ?? 'triangle'
    osc.frequency.setValueAtTime(tone.freq, start)
    if (tone.slideTo) osc.frequency.linearRampToValueAtTime(tone.slideTo, end)

    // A short attack either way, then either a sustain with a quick release or a
    // decay across the whole tone. A hard stop clicks, so never end at zero.
    amp.gain.setValueAtTime(0.0001, start)
    amp.gain.exponentialRampToValueAtTime(peak, start + 0.012)
    if (tone.hold) {
      const release = Math.min(0.07, tone.duration * 0.3)
      amp.gain.setValueAtTime(peak, end - release)
    }
    amp.gain.exponentialRampToValueAtTime(0.0001, end)

    if (tone.tremoloHz) {
      // The LFO adds to the scheduled gain, so the level swings around `peak`.
      const lfo = ctx.createOscillator()
      const depth = ctx.createGain()
      lfo.type = 'square'
      lfo.frequency.setValueAtTime(tone.tremoloHz, start)
      depth.gain.setValueAtTime(peak * (tone.tremoloDepth ?? 0.6), start)
      lfo.connect(depth).connect(amp.gain)
      lfo.start(start)
      lfo.stop(end)
    }

    osc.connect(amp).connect(ctx.destination)
    osc.start(start)
    osc.stop(end + 0.02)
  }
}

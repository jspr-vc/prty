import type { NarrationMode } from '@workspace/common/consts'
import { narrateAll, type RenderProgress } from './narrate'

/**
 * The console's version of `gameshows narrate`.
 *
 * One job at a time, in this process, with its progress readable over HTTP.
 * Rendering a pack takes minutes on a neural voice, which is far too long to
 * hold a request open for, and there is only ever one host — so the job is a
 * single piece of module state rather than a queue.
 */
export interface RenderJob extends RenderProgress {
  running: boolean
  /** Null until something goes wrong, and then the reason to show the host. */
  error: string | null
  pack: string | null
  regenerate: boolean
  startedAt: number
  finishedAt: number | null
}

const idle: RenderJob = {
  running: false,
  done: 0,
  total: 0,
  rendered: 0,
  cached: 0,
  failed: 0,
  error: null,
  pack: null,
  regenerate: false,
  startedAt: 0,
  finishedAt: null,
}

let job: RenderJob = idle

export function renderStatus(): RenderJob {
  return job
}

export interface StartRenderOptions {
  pack?: string
  voice: string | null
  rate: number
  mode: NarrationMode
  regenerate: boolean
}

/**
 * Starts a render and returns immediately. A second call while one is running
 * is ignored rather than queued: the host pressed the button twice.
 */
export function startRender(options: StartRenderOptions): RenderJob {
  if (job.running) return job

  job = {
    ...idle,
    running: true,
    pack: options.pack ?? null,
    regenerate: options.regenerate,
    startedAt: Date.now(),
  }

  void narrateAll({
    pack: options.pack,
    voice: options.voice,
    rate: options.rate,
    mode: options.mode,
    regenerate: options.regenerate,
    quiet: true,
    onProgress: (progress) => {
      job = { ...job, ...progress }
    },
  })
    .then((result) => {
      job = { ...job, running: false, finishedAt: Date.now(), error: result.error ?? null }
    })
    .catch((error: unknown) => {
      job = { ...job, running: false, finishedAt: Date.now(), error: String(error) }
    })

  return job
}

import type { NarrationMode } from '@workspace/common/consts'
import type { NarrationLine } from '@workspace/common/game'
import { shouldNarrate } from '@workspace/common/game'
import { useEffect, useRef } from 'react'
import { narrate, stopNarration } from '@/lib/narration'

/**
 * Reads the board out loud as it changes.
 *
 * Keyed on the line's id, so a re-render, a buzz, or a second screen joining
 * mid-clue all stay quiet. A screen that *loads* with narration already on
 * adopts whatever is on the board without reading it — a reload in the middle
 * of a round should not blast the room — but the host switching narration on
 * does read what is up there, which is the whole point of switching it on.
 */
export function useNarration(
  line: NarrationLine | null,
  mode: NarrationMode,
  rate: number,
  voice: string | null,
  /**
   * Bumped by the host to hear the current line again. `fresh` means the clip
   * was just re-rendered, so the browser's cached copy has to be skipped.
   */
  replay: { token: number; fresh?: boolean } = { token: 0 },
): void {
  const spokenId = useRef<string | null>(null)
  const settled = useRef(false)
  const previousMode = useRef<NarrationMode>(mode)

  useEffect(() => {
    const justTurnedOn = previousMode.current === 'off' && mode !== 'off'
    previousMode.current = mode

    if (mode === 'off') {
      stopNarration()
      return
    }

    // The "arrived mid-round" guard is spent the first time this screen sees
    // narration switched on, not on the first render.
    //
    // It used to sit after the `mode === 'off'` return above, which meant that
    // with narration off by default — as it always is — the guard was still
    // unspent when the host turned it on, and swallowed the very line they had
    // turned it on to hear.
    if (!settled.current) {
      settled.current = true
      if (!justTurnedOn) {
        spokenId.current = line?.id ?? null
        return
      }
    }

    if (justTurnedOn) spokenId.current = null

    if (!line || !shouldNarrate(line, mode)) return
    if (spokenId.current === line.id) return
    spokenId.current = line.id
    void narrate(line.text, { rate, voice })
  }, [line, mode, rate, voice])

  // Replaying is the host asking for the line the room already missed, so it
  // deliberately goes around the spoken-id guard that keeps every other path
  // quiet. Everything it needs comes from a ref: this must fire when the token
  // changes and at no other time, or a rate change would re-read the board.
  const latest = useRef({ line, mode, rate, voice })
  latest.current = { line, mode, rate, voice }

  // Compared against the last token seen rather than a "have I run yet" flag:
  // under StrictMode an effect is mounted, thrown away and mounted again while
  // refs survive, and a flag would read that second mount as a replay and read
  // the board out on load.
  const spokenToken = useRef(replay.token)
  useEffect(() => {
    if (spokenToken.current === replay.token) return
    spokenToken.current = replay.token
    const current = latest.current
    if (!current.line || !shouldNarrate(current.line, current.mode)) return
    // `narrate` cancels whatever is still being said, so a replay pressed
    // mid-sentence restarts the line rather than queueing a second copy of it.
    spokenId.current = current.line.id
    void narrate(current.line.text, {
      rate: current.rate,
      voice: current.voice,
      fresh: replay.fresh,
    })
  }, [replay])

  useEffect(() => stopNarration, [])
}

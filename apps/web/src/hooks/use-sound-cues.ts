'use client'

import type { Cue } from '@workspace/ui/lib/sound'
import { play } from '@workspace/ui/lib/sound'
import { useEffect, useRef } from 'react'

/**
 * The TV has no idea what the host clicked, only what the state looks like now.
 * Cues are therefore derived by diffing the previous render's state against this
 * one, which keeps the audio in step with whatever the reducer decided.
 */
export function useCue(cue: Cue | null, key: string | number | null) {
  const last = useRef<string | number | null>(null)

  useEffect(() => {
    if (!cue || key === null || key === last.current) return
    // Skip the very first render so reopening the TV mid-game stays silent.
    if (last.current !== null) play(cue)
    last.current = key
  }, [cue, key])
}

/** Fires whenever `value` changes to something new, after the first render. */
export function useTransitionCue<T>(value: T, resolve: (previous: T, next: T) => Cue | null) {
  const previous = useRef<T | undefined>(undefined)

  useEffect(() => {
    if (previous.current !== undefined && previous.current !== value) {
      const cue = resolve(previous.current, value)
      if (cue) play(cue)
    }
    previous.current = value
  })
}

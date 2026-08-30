'use client'

import { useEffect, useRef, useState } from 'react'

/** Animates a score from its previous value to the new one. */
export function useCountUp(value: number, durationMs = 500): number {
  const [display, setDisplay] = useState(value)
  const from = useRef(value)
  const frame = useRef<number>(undefined)

  useEffect(() => {
    const start = performance.now()
    const origin = from.current
    if (origin === value) return

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      // Ease out: fast off the mark, settling into the final number.
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(origin + (value - origin) * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
      else from.current = value
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      from.current = value
    }
  }, [value, durationMs])

  return display
}

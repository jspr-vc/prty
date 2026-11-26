import { useCallback, useEffect, useRef, useState } from 'react'

const LIT_MS = 1500

/**
 * Who pressed a buzzer in the last moment or so, while no match is running.
 *
 * The value is the time of the latest press rather than a flag, so a component
 * can key an animation on it and replay it on every press, not only the first.
 */
export function useBuzzerTests(): {
  lit: ReadonlyMap<string, number>
  record: (playerId: string) => void
} {
  const [lit, setLit] = useState<ReadonlyMap<string, number>>(new Map())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const record = useCallback((playerId: string) => {
    const stamp = Date.now()
    setLit((current) => new Map(current).set(playerId, stamp))

    const pending = timers.current.get(playerId)
    if (pending) clearTimeout(pending)
    timers.current.set(
      playerId,
      setTimeout(() => {
        timers.current.delete(playerId)
        setLit((current) => {
          const next = new Map(current)
          next.delete(playerId)
          return next
        })
      }, LIT_MS),
    )
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
    }
  }, [])

  return { lit, record }
}

import { BUZZER_KEYS, BUZZER_RESET_KEY, type BuzzerKey } from '@workspace/common/consts'
import { useEffect, useRef } from 'react'

/** Every pad, reset included. Narrow enough that callers can switch on it. */
export type BuzzerPad = BuzzerKey | typeof BUZZER_RESET_KEY

const WATCHED = new Set<string>([...BUZZER_KEYS, BUZZER_RESET_KEY])

/**
 * Listens for a physical buzzer set.
 *
 * The hardware is a keyboard as far as the browser is concerned, and every pad
 * sends one function key from F13 up, with F24 as reset. Matching on
 * `KeyboardEvent.code` rather than `key` means a box that announces a non-US
 * layout still lands on the right pad.
 *
 * Auto-repeat is dropped here as well as debounced on the server: holding a pad
 * down otherwise machine-guns the room with presses.
 */
export function useBuzzerKeys(onPress: (key: BuzzerPad) => void, enabled = true): void {
  const handler = useRef(onPress)
  handler.current = onPress

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !WATCHED.has(event.code)) return
      // Nothing else wants F13–F24, but a browser may still have a default for
      // one of them, and the host must not lose focus mid-show.
      event.preventDefault()
      handler.current(event.code as BuzzerPad)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}

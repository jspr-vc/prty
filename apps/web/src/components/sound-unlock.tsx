import { enableSound } from '@workspace/ui/lib/sound'
import { useEffect } from 'react'

const GESTURES = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Browsers refuse to start audio until the page has seen a real gesture, so take
 * the first one that arrives — typing the room code, or a tap anywhere on the
 * TV — and unlock silently. There is no on-screen control: the room already has
 * a volume knob.
 */
export function SoundUnlock() {
  useEffect(() => {
    // Already permitted (the viewer has used this site before)? Nothing to wait for.
    void enableSound()

    const unlock = () => {
      void enableSound()
      for (const event of GESTURES) document.removeEventListener(event, unlock)
    }
    for (const event of GESTURES) {
      document.addEventListener(event, unlock, { passive: true })
    }
    return () => {
      for (const event of GESTURES) document.removeEventListener(event, unlock)
    }
  }, [])

  return null
}

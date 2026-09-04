import { useEffect } from 'react'

type Kind = 'tv' | 'player' | 'console'

/**
 * One app now serves three very different screens, so the classes that used to
 * live on three separate `<html>` elements are applied per route instead.
 *
 * The big screen deliberately does not get `dark`: its palette is the fixed
 * `--stage-*` set, the same in a viewer's light or dark theme. The phone and
 * the console do, because both are used in the same darkened room.
 */
export function useSurface(kind: Kind): void {
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const dark = kind !== 'tv'

    root.classList.toggle('dark', dark)
    // The TV must never show a scrollbar; a phone and the console must scroll.
    body.classList.toggle('overflow-hidden', kind === 'tv')

    return () => {
      root.classList.remove('dark')
      body.classList.remove('overflow-hidden')
    }
  }, [kind])
}

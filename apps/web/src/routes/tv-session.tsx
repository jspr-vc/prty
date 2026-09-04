import { SoundUnlock } from '@/components/sound-unlock'
import { useSurface } from '@/components/surface'
import { TvScreen } from '@/components/tv-screen'
import { useSessionCode } from '@/router'

export function TvSession() {
  const code = useSessionCode()
  useSurface('tv')

  return (
    <>
      <TvScreen code={code} />
      <SoundUnlock />
    </>
  )
}

import { JoinForm } from '@/components/join-form'
import { SoundUnlock } from '@/components/sound-unlock'
import { useSurface } from '@/components/surface'
import { useSessionCode } from '@/router'

export function JoinRoute() {
  const code = useSessionCode()
  useSurface('player')

  return (
    <>
      <JoinForm code={code} />
      <SoundUnlock />
    </>
  )
}

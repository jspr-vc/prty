import { HostGate } from '@/components/host-gate'
import { SessionConsole } from '@/components/session-console'
import { useSurface } from '@/components/surface'
import { useSessionCode } from '@/router'

export function HostSession() {
  const code = useSessionCode()
  useSurface('console')

  return (
    <HostGate>
      <SessionConsole code={code} />
    </HostGate>
  )
}

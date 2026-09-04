import { APP_NAME } from '@workspace/common/consts'
import { CodeEntry } from '@/components/code-entry'
import { SoundUnlock } from '@/components/sound-unlock'
import { useSurface } from '@/components/surface'

export function TvHome() {
  useSurface('tv')

  return (
    <main className="flex h-svh flex-col items-center justify-center gap-10 bg-stage text-stage-fg">
      <div className="space-y-3 text-center">
        <h1 className="stage-display font-bold uppercase tracking-tight">{APP_NAME}</h1>
        <p className="stage-item text-stage-muted">Enter the code from the host console.</p>
      </div>
      <CodeEntry />
      <SoundUnlock />
    </main>
  )
}

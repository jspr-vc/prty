'use client'

import type { MatchContext } from '@workspace/common/game'
import { FeudDisplay } from '@workspace/game-family-feud/display'
import { JeopardyDisplay } from '@workspace/game-jeopardy/display'

// biome-ignore lint/suspicious/noExplicitAny: each game narrows its own pack/state
const displays: Record<string, React.ComponentType<any>> = {
  jeopardy: JeopardyDisplay,
  'family-feud': FeudDisplay,
}

export function GameDisplay({
  slug,
  ...props
}: {
  slug: string
  pack: unknown
  state: unknown
  ctx: MatchContext
}) {
  const Component = displays[slug]
  if (!Component) {
    return (
      <div className="flex h-svh items-center justify-center bg-black text-white">
        No display for “{slug}”.
      </div>
    )
  }
  return <Component {...props} />
}

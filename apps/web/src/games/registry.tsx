'use client'

import type { MatchContext } from '@workspace/common/game'
import { FeudControl } from '@workspace/game-family-feud/control'
import { FeudDisplay } from '@workspace/game-family-feud/display'
import { JeopardyControl } from '@workspace/game-jeopardy/control'
import { JeopardyDisplay } from '@workspace/game-jeopardy/display'

/**
 * Components live here rather than in `@workspace/games` so the registry the API
 * imports to run reducers stays free of React.
 */
// biome-ignore lint/suspicious/noExplicitAny: each game narrows its own pack/state
const displays: Record<string, React.ComponentType<any>> = {
  jeopardy: JeopardyDisplay,
  'family-feud': FeudDisplay,
}

// biome-ignore lint/suspicious/noExplicitAny: each game narrows its own pack/state/action
const controls: Record<string, React.ComponentType<any>> = {
  jeopardy: JeopardyControl,
  'family-feud': FeudControl,
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
      <div className="flex h-svh items-center justify-center bg-stage text-stage-fg">
        No display for “{slug}”.
      </div>
    )
  }
  return <Component {...props} />
}

export function GameControl({
  slug,
  ...props
}: {
  slug: string
  pack: unknown
  state: unknown
  ctx: MatchContext
  onAction: (action: unknown) => void
  pending?: boolean
}) {
  const Component = controls[slug]
  if (!Component) {
    return <p className="text-muted-foreground text-sm">No control panel for “{slug}”.</p>
  }
  return <Component {...props} />
}

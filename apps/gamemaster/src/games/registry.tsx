'use client'

import type { MatchContext } from '@workspace/common/game'
import { FeudControl } from '@workspace/game-family-feud/control'
import { JeopardyControl } from '@workspace/game-jeopardy/control'

export interface ControlProps {
  pack: never
  state: never
  ctx: MatchContext
  onAction: (action: never) => void
  pending?: boolean
}

/**
 * Components live here rather than in `@workspace/games` so the registry the API
 * imports stays free of React.
 */
// biome-ignore lint/suspicious/noExplicitAny: each game narrows its own pack/state/action
const controls: Record<string, React.ComponentType<any>> = {
  jeopardy: JeopardyControl,
  'family-feud': FeudControl,
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

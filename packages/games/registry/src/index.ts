import type { GameSlug } from '@workspace/common/consts'
import type { AnyGameDefinition, MatchContext } from '@workspace/common/game'
import { familyFeud } from '@workspace/game-family-feud'
import { jeopardy } from '@workspace/game-jeopardy'

/**
 * Logic only, no components: the API package imports this to run reducers
 * server-side, and must not pull React into its bundle.
 */
export const games = {
  jeopardy,
  'family-feud': familyFeud,
} satisfies Record<GameSlug, AnyGameDefinition>

export function getGame(slug: string): AnyGameDefinition | null {
  return (games as Record<string, AnyGameDefinition>)[slug] ?? null
}

export interface AppliedAction {
  state: unknown
  changed: boolean
  action: { type: string }
}

/** Parses a pack and an action against the game's own schemas, then reduces. */
export function applyAction(
  definition: AnyGameDefinition,
  rawPack: unknown,
  rawState: unknown,
  rawAction: unknown,
  ctx: MatchContext,
): AppliedAction {
  const pack = definition.packSchema.parse(rawPack)
  const state = definition.stateSchema.parse(rawState)
  const action = definition.actionSchema.parse(rawAction)
  const next = definition.reduce(pack, state, action, ctx)
  return { state: next, changed: next !== state, action }
}

/** Validates a phone's action against the game's own rules before reducing. */
export function applyPlayerAction(
  definition: AnyGameDefinition,
  rawPack: unknown,
  rawState: unknown,
  rawAction: unknown,
  playerId: string,
  ctx: MatchContext,
): AppliedAction | null {
  const pack = definition.packSchema.parse(rawPack)
  const state = definition.stateSchema.parse(rawState)
  const action = definition.authorizePlayerAction(rawAction, playerId, state, ctx)
  if (!action) return null
  const next = definition.reduce(pack, state, action, ctx)
  return { state: next, changed: next !== state, action }
}

export function createInitialState(
  definition: AnyGameDefinition,
  rawPack: unknown,
  ctx: MatchContext,
): unknown {
  return definition.createState(definition.packSchema.parse(rawPack), ctx)
}

export { familyFeud, jeopardy }

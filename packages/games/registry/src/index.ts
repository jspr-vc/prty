import type { GameSlug } from '@workspace/common/consts'
import type { AnyGameDefinition, MatchContext, NarrationLine } from '@workspace/common/game'
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

/**
 * A press on a physical pad, already resolved to the player it belongs to.
 *
 * The game decides what a pad means, so a game with no buzzers simply does not
 * implement `buzzerAction` and every press is a no-op rather than an error.
 */
export function applyBuzzerAction(
  definition: AnyGameDefinition,
  rawPack: unknown,
  rawState: unknown,
  playerId: string,
  ctx: MatchContext,
): AppliedAction | null {
  if (!definition.buzzerAction) return null
  const pack = definition.packSchema.parse(rawPack)
  const state = definition.stateSchema.parse(rawState)
  const action = definition.buzzerAction(playerId, state, ctx)
  if (!action) return null
  const next = definition.reduce(pack, state, action, ctx)
  return { state: next, changed: next !== state, action }
}

/** The reset pad, and the console button that does the same thing. */
export function applyBuzzerReset(
  definition: AnyGameDefinition,
  rawPack: unknown,
  rawState: unknown,
  ctx: MatchContext,
): AppliedAction | null {
  if (!definition.buzzerResetAction) return null
  const pack = definition.packSchema.parse(rawPack)
  const state = definition.stateSchema.parse(rawState)
  const action = definition.buzzerResetAction(state, ctx)
  if (!action) return null
  const next = definition.reduce(pack, state, action, ctx)
  return { state: next, changed: next !== state, action }
}

/** What the big screen should be reading right now, per the game itself. */
export function narrateMatch(
  definition: AnyGameDefinition,
  rawPack: unknown,
  rawState: unknown,
  ctx: MatchContext,
): NarrationLine | null {
  if (!definition.narrate) return null
  const parsedPack = definition.packSchema.safeParse(rawPack)
  const parsedState = definition.stateSchema.safeParse(rawState)
  // Narration is decoration. A state this build cannot parse should leave the
  // room quiet, never take the big screen down.
  if (!parsedPack.success || !parsedState.success) return null
  return definition.narrate(parsedPack.data, parsedState.data, ctx)
}

export function createInitialState(
  definition: AnyGameDefinition,
  rawPack: unknown,
  ctx: MatchContext,
): unknown {
  return definition.createState(definition.packSchema.parse(rawPack), ctx)
}

export { familyFeud, jeopardy }

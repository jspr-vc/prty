import type { z } from 'zod'

export interface MatchPlayer {
  id: string
  displayName: string
  teamId: string | null
}

export interface MatchTeam {
  id: string
  name: string
  color: string
}

/** Everything a reducer is allowed to know about the world outside its own state. */
export interface MatchContext {
  players: MatchPlayer[]
  teams: MatchTeam[]
}

/**
 * A game is a pure state machine plus the schemas that guard its edges. The
 * server owns the reducer; both apps render the state it produces.
 */
export interface GameDefinition<Pack, State, Action> {
  slug: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  packSchema: z.ZodType<Pack>
  stateSchema: z.ZodType<State>
  actionSchema: z.ZodType<Action>
  createState(pack: Pack, ctx: MatchContext): State
  reduce(pack: Pack, state: State, action: Action, ctx: MatchContext): State
  /**
   * Narrows a raw action sent from a player's phone to something that player is
   * actually allowed to do right now, or null to reject it. Implementations must
   * stamp the caller's own id onto the action rather than trusting the payload,
   * so a phone cannot buzz in as somebody else.
   */
  authorizePlayerAction(
    raw: unknown,
    playerId: string,
    state: State,
    ctx: MatchContext,
  ): Action | null
}

// biome-ignore lint/suspicious/noExplicitAny: the registry stores heterogeneous games
export type AnyGameDefinition = GameDefinition<any, any, any>

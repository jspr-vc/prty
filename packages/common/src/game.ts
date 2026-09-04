import type { z } from 'zod'
import type { NarrationMode } from './consts'

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
 * One thing the big screen should read out loud.
 *
 * `id` is what stops it repeating itself: the TV speaks a line when the id it
 * holds changes, so re-rendering the same board — or a second screen joining
 * mid-clue — stays quiet. Two different clues must never share an id.
 */
export interface NarrationLine {
  id: string
  text: string
  /** `clue` is read in every mode but `off`; `flavour` only in `everything`. */
  kind: 'clue' | 'flavour'
}

export function shouldNarrate(line: NarrationLine | null, mode: NarrationMode): boolean {
  if (!line || mode === 'off') return false
  return mode === 'everything' || line.kind === 'clue'
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
  /**
   * What the big screen should be saying right now, if anything. The game owns
   * this because only it knows which of its phases is holding readable text —
   * and knows not to read the answer out while the room is still guessing.
   */
  narrate?(pack: Pack, state: State, ctx: MatchContext): NarrationLine | null
  /**
   * Every line this pack could ever produce, so audio can be rendered before
   * the night rather than during it. Must use the same wording `narrate` does:
   * the cache is keyed on the text, so a mismatch renders lines nobody asks for.
   */
  narrationLines?(pack: Pack): NarrationLine[]
  /**
   * Turns a hardware buzzer press into an action, or null when the pad means
   * nothing in this phase. Kept beside the reducer so a new game decides for
   * itself what a physical pad does, rather than the API guessing.
   */
  buzzerAction?(playerId: string, state: State, ctx: MatchContext): Action | null
  /** What the reset pad does. Every game clears whoever is currently in. */
  buzzerResetAction?(state: State, ctx: MatchContext): Action | null
}

// biome-ignore lint/suspicious/noExplicitAny: the registry stores heterogeneous games
export type AnyGameDefinition = GameDefinition<any, any, any>

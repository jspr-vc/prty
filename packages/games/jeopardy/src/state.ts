import { z } from 'zod'

export const JEOPARDY_PHASES = [
  'board',
  /**
   * A Daily Double is wagered before it is read. The clue stays hidden on the
   * big screen through this phase — showing it while the player decides how
   * much to risk is the whole tell.
   */
  'daily_double',
  'clue',
  'buzzed',
  'revealed',
  'final_wager',
  'final_clue',
  'final_reveal',
  'finished',
] as const

export const jeopardyPhaseSchema = z.enum(JEOPARDY_PHASES)
export type JeopardyPhase = z.infer<typeof jeopardyPhaseSchema>

export const currentClueSchema = z.object({
  categoryIndex: z.number().int().nonnegative(),
  clueIndex: z.number().int().nonnegative(),
  value: z.number().int(),
  dailyDouble: z.boolean(),
})

export const jeopardyStateSchema = z.object({
  phase: jeopardyPhaseSchema,
  roundIndex: z.number().int().nonnegative(),
  /** `${roundIndex}:${categoryIndex}:${clueIndex}` for every clue already played. */
  usedClues: z.array(z.string()),
  current: currentClueSchema.nullable(),
  buzzedPlayerId: z.string().nullable(),
  /**
   * Whether a buzz is live right now.
   *
   * This is the latch, and it is deliberately its own field rather than
   * something inferred from `buzzedPlayerId`. A buzz disarms it, so a second
   * pad landing a few milliseconds later is rejected by the reducer rather than
   * racing the first one. Only an explicit signal re-arms it: a new clue, a
   * wrong answer that opens the clue back up, the reset pad, or the host.
   */
  buzzerArmed: z.boolean().default(false),
  /** Players who already guessed wrong on the current clue. */
  lockedOut: z.array(z.string()),
  /**
   * Who answered the current clue correctly, once one has been judged right.
   *
   * `buzzedPlayerId` is cleared by the verdict — the buzz is over — so without
   * this the reveal screen has no idea who just won the money, and the room
   * sees a score move with nothing attached to it.
   */
  correctPlayerId: z.string().nullable().default(null),
  /** Daily-double and final-round wagers, keyed by player id. */
  wagers: z.record(z.string(), z.number().int()),
  /**
   * Final Jeopardy verdicts, keyed by player id. Kept rather than folded
   * straight into `scores` so the host can correct a misjudgement: the reducer
   * knows what it previously applied and can undo exactly that much.
   */
  finalResults: z.record(z.string(), z.boolean()).default({}),
  scores: z.record(z.string(), z.number().int()),
  /** Who picks the next clue. */
  controlPlayerId: z.string().nullable(),
})

export type JeopardyState = z.infer<typeof jeopardyStateSchema>
export type JeopardyCurrentClue = z.infer<typeof currentClueSchema>

import { z } from 'zod'

export const JEOPARDY_PHASES = [
  'board',
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
  /** Players who already guessed wrong on the current clue. */
  lockedOut: z.array(z.string()),
  /** Daily-double and final-round wagers, keyed by player id. */
  wagers: z.record(z.string(), z.number().int()),
  scores: z.record(z.string(), z.number().int()),
  /** Who picks the next clue. */
  controlPlayerId: z.string().nullable(),
})

export type JeopardyState = z.infer<typeof jeopardyStateSchema>
export type JeopardyCurrentClue = z.infer<typeof currentClueSchema>

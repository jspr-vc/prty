import { z } from 'zod'

export const FEUD_PHASES = ['face_off', 'play', 'steal', 'round_over', 'finished'] as const

export const feudPhaseSchema = z.enum(FEUD_PHASES)
export type FeudPhase = z.infer<typeof feudPhaseSchema>

export const feudStateSchema = z.object({
  phase: feudPhaseSchema,
  roundIndex: z.number().int().nonnegative(),
  /** Indices of answers turned over on the current board. */
  revealed: z.array(z.number().int().nonnegative()),
  strikes: z.number().int().min(0),
  /** Points banked on the board this round, before the multiplier. */
  pot: z.number().int().min(0),
  controlTeamId: z.string().nullable(),
  stealingTeamId: z.string().nullable(),
  /** Who hit their phone first in the face-off. */
  buzzedPlayerId: z.string().nullable(),
  scores: z.record(z.string(), z.number().int()),
})

export type FeudState = z.infer<typeof feudStateSchema>

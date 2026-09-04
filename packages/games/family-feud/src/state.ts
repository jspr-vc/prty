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
  /** Who hit their buzzer first in the face-off. */
  buzzedPlayerId: z.string().nullable(),
  /**
   * Whether a face-off buzz is live right now.
   *
   * The face-off is the one moment in Feud where two people race, so the latch
   * matters: the first press disarms the room, and only a new round, the reset
   * pad or the host arms it again. See the same field in Jeopardy for why this
   * is not inferred from `buzzedPlayerId`.
   */
  buzzerArmed: z.boolean().default(false),
  /**
   * X's given during the current face-off.
   *
   * Deliberately not `strikes`: the three strikes belong to a team that has the
   * board, and nobody has it yet. A face-off answer that is not up there gets
   * the same X and the same buzzer, then play passes to the other contestant,
   * and none of it should spend a strike the round proper is going to need.
   *
   * A count rather than a list of who missed, because the second contestant in
   * a face-off answers by turn rather than by buzzing in: half the time there
   * is nobody buzzed to attribute the X to.
   */
  faceOffMisses: z.number().int().min(0).default(0),
  scores: z.record(z.string(), z.number().int()),
})

export type FeudState = z.infer<typeof feudStateSchema>

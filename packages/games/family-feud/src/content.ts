import { z } from 'zod'

export const MAX_STRIKES = 3

export const feudAnswerSchema = z.object({
  text: z.string().min(1),
  points: z.number().int().positive(),
})

export const feudRoundSchema = z.object({
  question: z.string().min(1),
  /** Round multiplier: 1x, 2x, 3x in the televised format. */
  multiplier: z.number().int().positive().default(1),
  answers: z.array(feudAnswerSchema).min(1).max(8),
})

export const feudPackSchema = z.object({
  rounds: z.array(feudRoundSchema).min(1),
})

export type FeudAnswer = z.infer<typeof feudAnswerSchema>
export type FeudRound = z.infer<typeof feudRoundSchema>
export type FeudPack = z.infer<typeof feudPackSchema>

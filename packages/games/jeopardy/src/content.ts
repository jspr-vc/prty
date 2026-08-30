import { z } from 'zod'

export const jeopardyClueSchema = z.object({
  clue: z.string().min(1),
  answer: z.string().min(1),
  dailyDouble: z.boolean().default(false),
})

export const jeopardyCategorySchema = z.object({
  name: z.string().min(1),
  clues: z.array(jeopardyClueSchema).min(1),
})

export const jeopardyRoundSchema = z.object({
  name: z.string().min(1),
  /** Row values, top to bottom. Must be as long as the longest category. */
  values: z.array(z.number().int().positive()).min(1),
  categories: z.array(jeopardyCategorySchema).min(1).max(6),
})

export const jeopardyPackSchema = z.object({
  rounds: z.array(jeopardyRoundSchema).min(1),
  final: z.object({
    category: z.string().min(1),
    clue: z.string().min(1),
    answer: z.string().min(1),
  }),
})

export type JeopardyClue = z.infer<typeof jeopardyClueSchema>
export type JeopardyCategory = z.infer<typeof jeopardyCategorySchema>
export type JeopardyRound = z.infer<typeof jeopardyRoundSchema>
export type JeopardyPack = z.infer<typeof jeopardyPackSchema>

export function clueKey(roundIndex: number, categoryIndex: number, clueIndex: number): string {
  return `${roundIndex}:${categoryIndex}:${clueIndex}`
}

export function clueValue(round: JeopardyRound, clueIndex: number): number {
  return round.values[clueIndex] ?? round.values[round.values.length - 1] ?? 0
}

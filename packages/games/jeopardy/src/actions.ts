import { z } from 'zod'

export const jeopardyActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('select_clue'),
    categoryIndex: z.number().int().nonnegative(),
    clueIndex: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal('buzz'), playerId: z.string() }),
  z.object({ type: z.literal('clear_buzz') }),
  z.object({ type: z.literal('judge'), correct: z.boolean() }),
  z.object({ type: z.literal('reveal_answer') }),
  z.object({ type: z.literal('return_to_board') }),
  z.object({ type: z.literal('set_wager'), playerId: z.string(), amount: z.number().int().min(0) }),
  z.object({ type: z.literal('set_control'), playerId: z.string().nullable() }),
  z.object({ type: z.literal('adjust_score'), playerId: z.string(), delta: z.number().int() }),
  z.object({ type: z.literal('next_round') }),
  z.object({ type: z.literal('start_final') }),
  z.object({ type: z.literal('reveal_final') }),
  z.object({ type: z.literal('finish') }),
])

export type JeopardyAction = z.infer<typeof jeopardyActionSchema>
export type JeopardyActionType = JeopardyAction['type']

/**
 * What a phone is allowed to send. Deliberately narrower than the host's action
 * union, and carries no player id: the server stamps the caller's own.
 */
export const jeopardyPlayerActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('buzz') }),
  z.object({ type: z.literal('set_wager'), amount: z.number().int().min(0) }),
])

export type JeopardyPlayerAction = z.infer<typeof jeopardyPlayerActionSchema>

import { z } from 'zod'

export const feudActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('reveal'), answerIndex: z.number().int().nonnegative() }),
  z.object({ type: z.literal('hide'), answerIndex: z.number().int().nonnegative() }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('face_off_buzz'), playerId: z.string() }),
  z.object({ type: z.literal('clear_buzz') }),
  z.object({ type: z.literal('set_buzzers_armed'), armed: z.boolean() }),
  z.object({ type: z.literal('clear_strikes') }),
  z.object({ type: z.literal('set_control'), teamId: z.string().nullable() }),
  z.object({ type: z.literal('start_steal'), teamId: z.string() }),
  z.object({ type: z.literal('award_pot'), teamId: z.string() }),
  z.object({ type: z.literal('adjust_score'), teamId: z.string(), delta: z.number().int() }),
  z.object({ type: z.literal('set_score'), teamId: z.string(), value: z.number().int() }),
  z.object({ type: z.literal('next_round') }),
  z.object({ type: z.literal('finish') }),
])

export type FeudAction = z.infer<typeof feudActionSchema>

/** What a phone is allowed to send: hit the face-off buzzer, nothing else. */
export const feudPlayerActionSchema = z.object({ type: z.literal('face_off_buzz') })

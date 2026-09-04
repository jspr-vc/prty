import { z } from 'zod'
import {
  BUZZER_KEYS,
  BUZZER_RESET_KEY,
  GAME_SLUGS,
  HOST_PIN_LENGTH,
  MATCH_STATUSES,
  NARRATION_MODES,
  SESSION_CODE_LENGTH,
  SESSION_STATUSES,
} from './consts'

export const sessionCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(SESSION_CODE_LENGTH)
  .regex(/^[A-Z0-9]+$/)

export const sessionStatusSchema = z.enum(SESSION_STATUSES)
export const matchStatusSchema = z.enum(MATCH_STATUSES)
export const gameSlugSchema = z.enum(GAME_SLUGS)

export const displayNameSchema = z.string().trim().min(1).max(24)
export const sessionNameSchema = z.string().trim().min(1).max(64)
export const playerTokenSchema = z.uuid()

export const hostPinSchema = z
  .string()
  .trim()
  .length(HOST_PIN_LENGTH)
  .regex(/^[0-9]+$/)

/** Every pad the hardware can send, including reset. */
export const buzzerKeySchema = z.enum([...BUZZER_KEYS, BUZZER_RESET_KEY])
/** Only the pads a host may bind to somebody: reset belongs to the room, not a player. */
export const bindableBuzzerKeySchema = z.enum(BUZZER_KEYS)

export const narrationModeSchema = z.enum(NARRATION_MODES)
/** Percent of the voice's natural speed. A TV in a loud room wants it slower. */
export const narrationRateSchema = z.number().int().min(50).max(150)

export const createSessionSchema = z.object({
  name: sessionNameSchema,
  teamNames: z.array(z.string().trim().min(1).max(24)).max(6).default([]),
})

export const joinSessionSchema = z.object({
  code: sessionCodeSchema,
  displayName: displayNameSchema,
  teamId: z.uuid().nullish(),
})

/**
 * A binding points at exactly one of a player or a team — never both, never
 * neither. Modelling it as a union rather than two nullable columns is what
 * keeps "bound to nothing" from being representable.
 */
export const buzzerTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('player'), playerId: z.uuid() }),
  z.object({ kind: z.literal('team'), teamId: z.uuid() }),
])

export type BuzzerTarget = z.infer<typeof buzzerTargetSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type JoinSessionInput = z.infer<typeof joinSessionSchema>

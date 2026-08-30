import { z } from 'zod'
import { GAME_SLUGS, MATCH_STATUSES, SESSION_CODE_LENGTH, SESSION_STATUSES } from './consts'

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

export const createSessionSchema = z.object({
  name: sessionNameSchema,
  teamNames: z.array(z.string().trim().min(1).max(24)).max(6).default([]),
})

export const joinSessionSchema = z.object({
  code: sessionCodeSchema,
  displayName: displayNameSchema,
  teamId: z.uuid().nullish(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type JoinSessionInput = z.infer<typeof joinSessionSchema>

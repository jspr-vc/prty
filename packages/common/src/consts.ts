export const APP_NAME = 'Gameshows'

export const SESSION_CODE_LENGTH = 4
export const SESSION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const MAX_PLAYERS_PER_SESSION = 24
export const MIN_PLAYERS_PER_SESSION = 2

export const SESSION_STATUSES = ['lobby', 'active', 'finished', 'abandoned'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const MATCH_STATUSES = ['pending', 'active', 'paused', 'finished'] as const
export type MatchStatus = (typeof MATCH_STATUSES)[number]

export const GAME_SLUGS = ['jeopardy', 'family-feud'] as const
export type GameSlug = (typeof GAME_SLUGS)[number]

export const TEAM_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#f97316',
] as const

export const PLAYER_TOKEN_STORAGE_KEY = 'gameshows.player-token'

/**
 * A USB buzzer set presents itself as a keyboard. Each pad sends one function
 * key from F13 upwards — keys no application binds, which is the whole reason
 * the hardware picked them — and the reset pad sends F24.
 *
 * These are `KeyboardEvent.code` values, not `key`: a buzzer that reports
 * itself with a non-US layout still produces the same `code`.
 */
export const BUZZER_KEYS = [
  'F13',
  'F14',
  'F15',
  'F16',
  'F17',
  'F18',
  'F19',
  'F20',
  'F21',
  'F22',
  'F23',
] as const
export type BuzzerKey = (typeof BUZZER_KEYS)[number]

/** The pad that clears whoever is currently in, so the host can re-arm the room. */
export const BUZZER_RESET_KEY = 'F24'

/** Ignore a second press of the same pad inside this window: contacts bounce. */
export const BUZZER_DEBOUNCE_MS = 250

export const HOST_PIN_LENGTH = 6
/** The host console sends its PIN on every call; there is no cookie and no login. */
export const HOST_PIN_HEADER = 'x-gameshows-host-pin'
export const HOST_PIN_STORAGE_KEY = 'gameshows.host-pin'

export const NARRATION_MODES = ['off', 'clues', 'everything'] as const
export type NarrationMode = (typeof NARRATION_MODES)[number]

export const DEFAULT_NARRATION_RATE = 95

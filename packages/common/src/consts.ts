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

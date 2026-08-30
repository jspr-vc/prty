/**
 * One Supabase Realtime topic per session. The TV, the host console and every
 * player phone subscribe to the same topic; the server is the only publisher.
 */
export function sessionTopic(sessionId: string): string {
  return `session:${sessionId}`
}

export const REALTIME_EVENT = 'gameshow'

export type SessionEvent =
  | { type: 'session_updated' }
  | { type: 'player_joined'; playerId: string; displayName: string }
  | { type: 'player_left'; playerId: string }
  | { type: 'teams_updated' }
  | { type: 'match_started'; matchId: string }
  | { type: 'match_updated'; matchId: string }
  | { type: 'match_ended'; matchId: string }

export type SessionEventType = SessionEvent['type']

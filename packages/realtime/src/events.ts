/**
 * One WebSocket topic per session. The TV, the host console and every player
 * phone subscribe to the same topic; the server is the only publisher.
 */
export function sessionTopic(sessionId: string): string {
  return `session:${sessionId}`
}

/**
 * `match_updated` carries the reduced state itself rather than a bare "go and
 * look again". Refetching meant a second round trip per client per action, and
 * the read model drags the whole question pack along with it — a buzz would
 * pull the entire Jeopardy board down onto every screen in the room. The
 * reducer still only ever runs on the server; this is the same state it wrote,
 * delivered rather than advertised.
 *
 * `rev` is the match's revision after the action. A client applies a message
 * only when it is newer than what it already holds, so one that arrives twice
 * or overtakes a newer one cannot roll the board backwards.
 */
export type SessionEvent =
  | { type: 'session_updated' }
  | { type: 'player_joined'; playerId: string; displayName: string }
  | { type: 'player_left'; playerId: string }
  | { type: 'teams_updated' }
  | { type: 'buzzers_updated' }
  | { type: 'match_started'; matchId: string }
  | { type: 'match_updated'; matchId: string; rev: number; state: unknown }
  | { type: 'match_ended'; matchId: string }
  /**
   * The host asking the big screen to read the current line again. Nothing has
   * changed, so this is the one event that must not send a screen back to the
   * server: it is a command, not a notification.
   */
  | {
      type: 'narration_replay'
      /**
       * The line was just re-rendered, so the copy the browser is holding is
       * stale. `/api/tts` answers with a day of cache, which is right for a
       * clue that never changes and wrong for the one case where it did.
       */
      fresh?: boolean
    }

export type SessionEventType = SessionEvent['type']

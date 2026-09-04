import type { SessionEvent } from './events'

/** Where the WebSocket lives. Same origin as everything else. */
export const WS_PATH = '/ws'

export function sessionSocketUrl(origin: string, sessionId: string): string {
  const url = new URL(WS_PATH, origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('session', sessionId)
  return url.toString()
}

/**
 * Everything a client may say on the socket.
 *
 * A buzzer press has its own message rather than going over HTTP because the
 * socket is already open and already ordered: the press reaches the server on
 * the connection it was made on, with no request setup in front of it. That is
 * also what lets a dedicated hardware bridge — a script on the machine the
 * buzzer box is plugged into — talk to the show without speaking tRPC.
 */
export type ClientMessage =
  | { type: 'ping' }
  /** A physical pad. `key` is a `KeyboardEvent.code`; F24 means re-arm. */
  | { type: 'buzzer'; key: string; pin?: string }

export type ServerMessage =
  | { type: 'ready'; sessionId: string }
  | { type: 'event'; event: SessionEvent }
  | { type: 'pong' }
  | { type: 'error'; message: string }

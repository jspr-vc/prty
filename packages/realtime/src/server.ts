import { type SessionEvent, sessionTopic } from './events'
import type { ServerMessage } from './protocol'

type Publisher = (topic: string, payload: string) => void

let publish: Publisher | null = null

/**
 * The WebSocket server hands its publish function in at startup.
 *
 * Everything now runs in one process, so this is a function call rather than an
 * HTTP round trip to a broker. Keeping it behind a registration seam is what
 * stops `@workspace/api` from having to import `Bun.serve` to send a message.
 */
export function setPublisher(fn: Publisher | null): void {
  publish = fn
}

export function broadcastToSession(sessionId: string, event: SessionEvent): void {
  if (!publish) return
  const message: ServerMessage = { type: 'event', event }
  publish(sessionTopic(sessionId), JSON.stringify(message))
}

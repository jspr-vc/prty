import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionEvent } from './events'
import type { ClientMessage, ServerMessage } from './protocol'
import { sessionSocketUrl } from './protocol'

export type ConnectionStatus = 'connecting' | 'connected' | 'error'

const PING_INTERVAL_MS = 25_000
const MAX_BACKOFF_MS = 5_000

export interface SessionChannel {
  status: ConnectionStatus
  /** Sends a hardware buzzer press over the socket that is already open. */
  buzz: (key: string, pin?: string) => void
}

/**
 * Subscribes to a session's topic over a WebSocket, reconnecting on its own.
 *
 * `onEvent` and `onResync` are held in refs so a new inline callback on every
 * render does not tear the socket down and build it again.
 *
 * `onResync` fires on every *re*connection, never the first: a socket that went
 * away missed whatever happened while it was gone, and the state pushes are not
 * replayed. The screen has to go and read once before it can trust the pushes
 * again.
 */
export function useSessionChannel(
  sessionId: string | null | undefined,
  onEvent: (event: SessionEvent) => void,
  onResync?: () => void,
): SessionChannel {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const socket = useRef<WebSocket | null>(null)
  const handler = useRef(onEvent)
  const resync = useRef(onResync)
  handler.current = onEvent
  resync.current = onResync

  useEffect(() => {
    if (!sessionId) return

    let closed = false
    let attempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let pingTimer: ReturnType<typeof setInterval> | undefined

    const connect = () => {
      if (closed) return
      const ws = new WebSocket(sessionSocketUrl(window.location.origin, sessionId))
      socket.current = ws

      ws.onopen = () => {
        if (closed) return
        setStatus('connected')
        // Only a reconnection needs a catch-up read; the first connection is
        // already paired with the query that fetched the session.
        if (attempt > 0) resync.current?.()
        attempt = 0
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' } satisfies ClientMessage))
          }
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (raw) => {
        let message: ServerMessage
        try {
          message = JSON.parse(String(raw.data)) as ServerMessage
        } catch {
          return
        }
        if (message.type === 'event') handler.current(message.event)
      }

      ws.onerror = () => {
        if (!closed) setStatus('error')
      }

      ws.onclose = () => {
        if (pingTimer) clearInterval(pingTimer)
        if (closed) return
        setStatus('connecting')
        attempt += 1
        // Back off, but never past a few seconds: this is a LAN, and the host
        // is standing in front of a screen that has stopped updating.
        const delay = Math.min(200 * 2 ** (attempt - 1), MAX_BACKOFF_MS)
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    // Coming back from a locked phone or a sleeping TV: the socket is usually
    // already dead but has not noticed yet.
    const wake = () => {
      if (document.visibilityState !== 'visible') return
      if (socket.current && socket.current.readyState > WebSocket.OPEN) {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        connect()
      }
    }
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('online', wake)

    return () => {
      closed = true
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('online', wake)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (pingTimer) clearInterval(pingTimer)
      socket.current?.close()
      socket.current = null
    }
  }, [sessionId])

  const buzz = useCallback((key: string, pin?: string) => {
    const ws = socket.current
    if (ws?.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'buzzer', key, pin } satisfies ClientMessage))
  }, [])

  return { status, buzz }
}

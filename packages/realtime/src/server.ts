import 'server-only'

import { env } from './env-realtime'
import { REALTIME_EVENT, type SessionEvent, sessionTopic } from './events'

/**
 * Publishes over Supabase Realtime's HTTP broadcast endpoint. Using HTTP rather
 * than a websocket keeps this safe to call from serverless request handlers,
 * which have no long-lived connection to reuse.
 */
export async function broadcastToSession(sessionId: string, event: SessionEvent): Promise<void> {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ topic: sessionTopic(sessionId), event: REALTIME_EVENT, payload: event }],
    }),
  })

  if (!response.ok) {
    console.error(
      `realtime broadcast failed (${response.status}): ${await response.text().catch(() => '')}`,
    )
  }
}

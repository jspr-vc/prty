'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { env } from './env-realtime'
import { REALTIME_EVENT, type SessionEvent, sessionTopic } from './events'

let client: SupabaseClient | undefined

export function getRealtimeClient(): SupabaseClient {
  client ??= createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  })
  return client
}

export type ConnectionStatus = 'connecting' | 'connected' | 'error'

/**
 * Subscribes to a session's realtime topic. `onEvent` is kept in a ref so a new
 * inline callback on every render does not tear down and rebuild the channel.
 */
export function useSessionChannel(
  sessionId: string | null | undefined,
  onEvent: (event: SessionEvent) => void,
): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const handler = useRef(onEvent)
  handler.current = onEvent

  useEffect(() => {
    if (!sessionId) return

    const channel = getRealtimeClient()
      .channel(sessionTopic(sessionId), { config: { private: false } })
      .on('broadcast', { event: REALTIME_EVENT }, ({ payload }) => {
        handler.current(payload as SessionEvent)
      })
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') setStatus('connected')
        else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') setStatus('error')
      })

    return () => {
      void getRealtimeClient().removeChannel(channel)
    }
  }, [sessionId])

  return status
}

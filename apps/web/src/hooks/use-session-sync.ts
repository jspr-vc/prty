import { useQueryClient } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import type { SessionEvent } from '@workspace/realtime'
import { type ConnectionStatus, useSessionChannel } from '@workspace/realtime/client'
import { useCallback, useRef } from 'react'

type Session = NonNullable<RouterOutputs['session']['byCode']>

/** Enough of a write's result to bring a screen up to date without asking. */
export interface MatchUpdate {
  matchId: string
  rev: number
  state: unknown
}

/**
 * Keeps one screen's copy of the session current.
 *
 * A match update carries its own state, so it is written straight into the
 * cache: no refetch, no waiting on the network a second time. Everything else
 * — someone joining, teams changing, a match starting or ending — moves rows
 * the push does not carry, so those still go back to the server.
 */
export function useSessionSync(
  code: string,
  sessionId: string | null | undefined,
  /** Runs alongside every full read, for queries this hook does not own. */
  onRefresh?: () => void,
  /**
   * The host asked for the current narration line again, `fresh` when the clip
   * was just re-rendered and the browser's copy of it is stale. Only the TV
   * listens.
   */
  onNarrationReplay?: (fresh: boolean) => void,
) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const refresh = useRef(onRefresh)
  refresh.current = onRefresh
  const replay = useRef(onNarrationReplay)
  replay.current = onNarrationReplay

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: trpc.session.byCode.queryKey(code) })
    refresh.current?.()
  }, [queryClient, trpc, code])

  /** Returns false when the update cannot be applied and a read is needed. */
  const applyMatch = useCallback(
    (update: MatchUpdate) => {
      const queryKey = trpc.session.byCode.queryKey(code)
      const current = queryClient.getQueryData(queryKey) as Session | undefined
      const active = current?.activeMatch
      // Either nothing is loaded yet, or this is about a match this screen has
      // never seen — the game and pack it needs only come from a full read.
      if (!current || !active || active.id !== update.matchId) return false
      // Already applied, or overtaken by something newer. Dropping it is the
      // point: a message that arrives late must not roll the board backwards.
      if (active.rev >= update.rev) return true

      queryClient.setQueryData(queryKey, {
        ...current,
        activeMatch: {
          ...active,
          rev: update.rev,
          state: update.state as typeof active.state,
        },
      })
      return true
    },
    [queryClient, trpc, code],
  )

  const onEvent = useCallback(
    (event: SessionEvent) => {
      if (event.type === 'match_updated' && applyMatch(event)) return
      // A replay changes nothing on the server, so reading again would cost a
      // round trip and the whole question pack to learn what this screen
      // already holds.
      if (event.type === 'narration_replay') {
        replay.current?.(event.fresh === true)
        return
      }
      invalidate()
      if (event.type === 'buzzers_updated') {
        void queryClient.invalidateQueries({ queryKey: trpc.buzzer.list.queryKey() })
      }
    },
    [applyMatch, invalidate, queryClient, trpc],
  )

  // A socket that dropped missed whatever happened while it was gone, and the
  // state pushes are not replayed — so a reconnect has to read once.
  const { status, buzz } = useSessionChannel(sessionId, onEvent, invalidate)

  return { status: status as ConnectionStatus, applyMatch, invalidate, buzz }
}

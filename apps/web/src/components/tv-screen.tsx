'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import { useSessionChannel } from '@workspace/realtime/client'
import type { Cue } from '@workspace/ui/lib/sound'
import { useCallback } from 'react'
import { Lobby } from '@/components/lobby'
import { GameDisplay } from '@/games/registry'
import { useTransitionCue } from '@/hooks/use-sound-cues'

type Session = NonNullable<RouterOutputs['session']['byCode']>

/**
 * The TV never sees the host's clicks, only the state they produced, so every
 * cue is derived by diffing renders. One signature string keeps that diff cheap
 * and covers both games with the same code.
 */
function cueSignature(session: Session | undefined): string {
  const match = session?.activeMatch
  if (!match) return 'lobby'
  const state = match.state as Record<string, unknown>
  return [
    match.id,
    state.phase,
    JSON.stringify(state.current ?? null),
    state.buzzedPlayerId ?? '',
    state.strikes ?? '',
    Array.isArray(state.revealed) ? state.revealed.length : '',
  ].join('|')
}

function resolveCue(previous: string, next: string): Cue | null {
  if (previous === 'lobby' && next !== 'lobby') return 'start'
  if (next === 'lobby') return 'finish'

  const [prevMatch, prevPhase, prevClue, prevBuzz, prevStrikes, prevRevealed] = previous.split('|')
  const [nextMatch, nextPhase, nextClue, nextBuzz, nextStrikes, nextRevealed] = next.split('|')

  if (prevMatch !== nextMatch) return 'start'
  if (nextPhase === 'finished') return 'finish'

  if (nextStrikes && Number(nextStrikes) > Number(prevStrikes)) return 'strike'
  if (nextRevealed && Number(nextRevealed) > Number(prevRevealed)) return 'reveal'

  if (prevClue !== nextClue && nextClue !== 'null') {
    return nextClue?.includes('"dailyDouble":true') ? 'dailyDouble' : 'clue'
  }
  // Any change to a new buzzer counts: two host clicks can land inside one
  // render, and the second one must still be heard.
  if (nextBuzz && prevBuzz !== nextBuzz) return 'buzz'
  if (prevPhase !== 'revealed' && nextPhase === 'revealed') return 'reveal'
  if (prevPhase !== 'round_over' && nextPhase === 'round_over') return 'roundWin'

  return null
}

export function TvScreen({ code, joinOrigin }: { code: string; joinOrigin: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const sessionQuery = useQuery(trpc.session.byCode.queryOptions(code))
  const session = sessionQuery.data

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: trpc.session.byCode.queryKey(code) })
  }, [queryClient, trpc, code])

  useSessionChannel(session?.id, invalidate)
  useTransitionCue(cueSignature(session), resolveCue)

  if (sessionQuery.isPending) return <Message>Connecting…</Message>
  if (!session) return <Message>No session with code {code}.</Message>

  const match = session.activeMatch

  return (
    <>
      {match ? (
        <GameDisplay
          slug={match.game.slug}
          pack={match.pack?.content}
          state={match.state}
          ctx={{
            players: session.players.map((player) => ({
              id: player.id,
              displayName: player.displayName,
              teamId: player.teamId,
            })),
            teams: session.teams.map((team) => ({
              id: team.id,
              name: team.name,
              color: team.color,
            })),
          }}
        />
      ) : (
        <Lobby session={session} joinOrigin={joinOrigin} />
      )}
    </>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="stage-title flex h-svh items-center justify-center bg-stage text-stage-fg">
      {children}
    </div>
  )
}

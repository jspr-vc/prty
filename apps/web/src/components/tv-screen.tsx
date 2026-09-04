import { useMutation, useQuery } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import { getGame, narrateMatch } from '@workspace/games'
import type { Cue } from '@workspace/ui/lib/sound'
import { useMemo, useState } from 'react'
import { Lobby } from '@/components/lobby'
import { GameDisplay } from '@/games/registry'
import { useBuzzerKeys } from '@/hooks/use-buzzer-keys'
import { useNarration } from '@/hooks/use-narration'
import { useSessionSync } from '@/hooks/use-session-sync'
import { useTransitionCue } from '@/hooks/use-sound-cues'

type Session = NonNullable<RouterOutputs['session']['byCode']>

/**
 * The TV never sees the host's clicks, only the state they produced, so every
 * cue is derived by diffing renders. One signature string keeps that diff cheap
 * and covers both games with the same code.
 */
export function cueSignature(session: Session | undefined): string {
  const match = session?.activeMatch
  if (!match) return 'lobby'
  const state = match.state as Record<string, unknown>
  const verdicts = state.finalResults
  return [
    match.id,
    state.phase,
    JSON.stringify(state.current ?? null),
    state.buzzedPlayerId ?? '',
    state.strikes ?? '',
    // A face-off X deliberately does not touch `strikes`, so it needs its own
    // field here or the room would see the X and hear nothing.
    state.faceOffMisses ?? '',
    Array.isArray(state.revealed) ? state.revealed.length : '',
    // A wrong answer is the only thing that lengthens the locked-out list, so
    // its length is how the TV hears a judgement it never saw.
    Array.isArray(state.lockedOut) ? state.lockedOut.length : '',
    verdicts && typeof verdicts === 'object'
      ? Object.values(verdicts).filter((verdict) => verdict === false).length
      : '',
  ].join('|')
}

export function resolveCue(previous: string, next: string): Cue | null {
  if (previous === 'lobby' && next !== 'lobby') return 'start'
  if (next === 'lobby') return 'finish'

  const [
    prevMatch,
    prevPhase,
    prevClue,
    prevBuzz,
    prevStrikes,
    prevFaceOffX,
    prevRevealed,
    prevOut,
    prevMissed,
  ] = previous.split('|')
  const [
    nextMatch,
    nextPhase,
    nextClue,
    nextBuzz,
    nextStrikes,
    nextFaceOffX,
    nextRevealed,
    nextOut,
    nextMissed,
  ] = next.split('|')

  if (prevMatch !== nextMatch) return 'start'
  if (nextPhase === 'finished') return 'finish'

  if (nextStrikes && Number(nextStrikes) > Number(prevStrikes)) return 'strike'
  // The same sound: to the room an X is an X, whether or not it cost a strike.
  if (nextFaceOffX && Number(nextFaceOffX) > Number(prevFaceOffX)) return 'strike'

  // Judged wrong — in a round, or in the final. Both are checked ahead of the
  // reveal below, because a wrong answer on a Daily Double (or from the last
  // player still in) also lands on `revealed`, and the buzzer is the half of
  // that the room actually needs to hear.
  if (nextOut && Number(nextOut) > Number(prevOut)) return 'wrong'
  if (nextMissed && Number(nextMissed) > Number(prevMissed)) return 'wrong'

  if (nextRevealed && Number(nextRevealed) > Number(prevRevealed)) return 'reveal'

  // The Daily Double fanfare belongs to the wager screen, which is now a phase
  // of its own — the clue itself arrives later and should not sound twice.
  if (prevPhase !== 'daily_double' && nextPhase === 'daily_double') return 'dailyDouble'
  if (prevClue !== nextClue && nextClue !== 'null') return 'clue'
  // Any change to a new buzzer counts: two host clicks can land inside one
  // render, and the second one must still be heard.
  if (nextBuzz && prevBuzz !== nextBuzz) return 'buzz'
  if (prevPhase !== 'revealed' && nextPhase === 'revealed') return 'reveal'
  if (prevPhase !== 'round_over' && nextPhase === 'round_over') return 'roundWin'

  return null
}

export function TvScreen({ code }: { code: string }) {
  const trpc = useTRPC()
  const sessionQuery = useQuery(trpc.session.byCode.queryOptions(code))
  const session = sessionQuery.data

  // A replay is a command, not a state change, so it is counted rather than
  // stored: the count is what tells the narration hook to read again, and
  // `fresh` says the clip behind it was just re-rendered.
  const [replay, setReplay] = useState({ token: 0, fresh: false })
  const { buzz, status } = useSessionSync(code, session?.id, undefined, (fresh) =>
    setReplay((current) => ({ token: current.token + 1, fresh })),
  )
  useTransitionCue(cueSignature(session), resolveCue)

  const match = session?.activeMatch

  const ctx = useMemo(
    () => ({
      players: (session?.players ?? []).map((player) => ({
        id: player.id,
        displayName: player.displayName,
        teamId: player.teamId,
      })),
      teams: (session?.teams ?? []).map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
      })),
    }),
    [session?.players, session?.teams],
  )

  // The game decides what is worth reading; this screen only decides whether
  // anyone is listening.
  const line = useMemo(() => {
    if (!match) return null
    const definition = getGame(match.game.slug)
    if (!definition) return null
    return narrateMatch(definition, match.pack?.content, match.state, ctx)
  }, [match, ctx])

  useNarration(
    line,
    session?.narrationMode ?? 'off',
    session?.narrationRate ?? 100,
    session?.narrationVoice ?? null,
    replay,
  )

  // A buzzer box plugged into the TV. The press goes out over the socket that
  // is already open — one less thing between the pad and the reducer — and
  // falls back to HTTP only while that socket is down, so a press is never
  // sent twice.
  const buzzOverHttp = useMutation(trpc.match.buzzer.mutationOptions())
  useBuzzerKeys((key) => {
    if (!session) return
    if (status === 'connected') buzz(key)
    else buzzOverHttp.mutate({ sessionId: session.id, key })
  }, Boolean(session))

  if (sessionQuery.isPending) return <Message>Connecting…</Message>
  if (!session) return <Message>No session with code {code}.</Message>

  return match ? (
    <GameDisplay slug={match.game.slug} pack={match.pack?.content} state={match.state} ctx={ctx} />
  ) : (
    <Lobby session={session} />
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="stage-title flex h-svh items-center justify-center bg-stage text-stage-fg">
      {children}
    </div>
  )
}

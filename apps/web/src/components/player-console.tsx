'use client'

import { useMutation } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'
import { useState } from 'react'

type Session = NonNullable<RouterOutputs['session']['byCode']>
type Player = NonNullable<RouterOutputs['session']['me']>

interface JeopardyView {
  phase: string
  buzzedPlayerId: string | null
  lockedOut: string[]
  current: { value: number; dailyDouble: boolean } | null
  scores: Record<string, number>
  wagers: Record<string, number>
}

interface FeudView {
  phase: string
  buzzedPlayerId: string | null
}

/** Vibrate where the browser supports it: on a phone the buzz should be felt. */
function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function PlayerConsole({
  session,
  me,
  token,
  onActed,
}: {
  session: Session
  me: Player
  /** Held by the phone, never served by the public session read. */
  token: string
  onActed: () => void
}) {
  const trpc = useTRPC()
  const match = session.activeMatch
  const [wager, setWager] = useState<number | null>(null)

  const act = useMutation(
    trpc.match.playerAction.mutationOptions({
      onSuccess: onActed,
    }),
  )

  if (!match) {
    return <Waiting>Waiting for the host to start a game.</Waiting>
  }

  const send = (action: unknown) => {
    act.mutate({ matchId: match.id, token, action })
  }

  if (match.game.slug === 'jeopardy') {
    const state = match.state as unknown as JeopardyView
    const lockedOut = state.lockedOut.includes(me.id)
    const iBuzzed = state.buzzedPlayerId === me.id
    const someoneElseBuzzed = Boolean(state.buzzedPlayerId) && !iBuzzed
    const canBuzz = state.phase === 'clue' && !lockedOut

    if (iBuzzed && state.current?.dailyDouble) {
      const max = Math.max(state.scores[me.id] ?? 0, state.current.value)
      const amount = wager ?? state.wagers[me.id] ?? state.current.value
      return (
        <div className="space-y-4">
          <Banner tone="gold">Daily Double — it's yours</Banner>
          <label className="block space-y-1.5">
            <span className="font-medium text-sm">Your wager (up to {max})</span>
            <input
              type="number"
              min={0}
              max={max}
              value={amount}
              onChange={(event) => setWager(Math.max(0, Number(event.target.value) || 0))}
              className="h-14 w-full rounded-md border bg-background px-4 text-center font-semibold text-3xl tabular-nums"
            />
          </label>
          <Button
            size="lg"
            className="h-14 w-full text-lg"
            disabled={act.isPending}
            onClick={() => send({ type: 'set_wager', amount: Math.min(amount, max) })}
          >
            Lock in wager
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {iBuzzed && <Banner tone="gold">You're in — answer!</Banner>}
        {lockedOut && <Banner tone="muted">You're out on this clue.</Banner>}
        {someoneElseBuzzed && <Banner tone="muted">Someone else buzzed first.</Banner>}
        <BuzzerButton
          disabled={!canBuzz || act.isPending}
          active={iBuzzed}
          onPress={() => {
            haptic(60)
            send({ type: 'buzz' })
          }}
        />
        <p className="text-center text-muted-foreground text-sm">
          Your score: <span className="font-semibold tabular-nums">{state.scores[me.id] ?? 0}</span>
        </p>
      </div>
    )
  }

  if (match.game.slug === 'family-feud') {
    const state = match.state as unknown as FeudView
    const iBuzzed = state.buzzedPlayerId === me.id
    const canBuzz = state.phase === 'face_off' && !state.buzzedPlayerId

    return (
      <div className="space-y-4">
        {iBuzzed && <Banner tone="gold">You won the face-off!</Banner>}
        {!iBuzzed && state.buzzedPlayerId && <Banner tone="muted">Someone else was faster.</Banner>}
        {state.phase !== 'face_off' && (
          <Banner tone="muted">Face-off is over. Watch the big screen.</Banner>
        )}
        <BuzzerButton
          disabled={!canBuzz || act.isPending}
          active={iBuzzed}
          onPress={() => {
            haptic(60)
            send({ type: 'face_off_buzz' })
          }}
        />
      </div>
    )
  }

  return <Waiting>Playing {match.game.name}. Watch the big screen.</Waiting>
}

function BuzzerButton({
  disabled,
  active,
  onPress,
}: {
  disabled: boolean
  active: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      // pointerdown, not click: on a buzzer every frame counts.
      onPointerDown={(event) => {
        event.preventDefault()
        if (!disabled) onPress()
      }}
      className={cn(
        'aspect-square w-full touch-manipulation select-none rounded-full font-bold text-4xl uppercase tracking-wide transition-transform duration-100',
        'active:scale-95',
        disabled
          ? 'bg-muted text-muted-foreground'
          : 'gs-buzzed bg-red-600 text-white shadow-lg shadow-red-600/40',
        active && 'gs-pop bg-amber-400 text-black',
      )}
    >
      {active ? 'In!' : 'Buzz'}
    </button>
  )
}

function Banner({ tone, children }: { tone: 'gold' | 'muted'; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-md px-4 py-3 text-center font-semibold',
        tone === 'gold' ? 'gs-pop bg-amber-400 text-black' : 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </p>
  )
}

function Waiting({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-muted-foreground text-sm">{children}</p>
}

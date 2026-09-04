import { useMutation } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import { formatScore } from '@workspace/common/utils'
import { clueKey, clueValue, type JeopardyPack } from '@workspace/game-jeopardy'
import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'
import { useState } from 'react'
import type { MatchUpdate } from '@/hooks/use-session-sync'

type Session = NonNullable<RouterOutputs['session']['byCode']>
type Player = NonNullable<RouterOutputs['session']['me']>

interface JeopardyView {
  phase: string
  roundIndex: number
  usedClues: string[]
  buzzedPlayerId: string | null
  buzzerArmed: boolean
  lockedOut: string[]
  correctPlayerId: string | null
  current: { value: number; dailyDouble: boolean } | null
  scores: Record<string, number>
  wagers: Record<string, number>
  finalResults: Record<string, boolean>
  controlPlayerId: string | null
}

interface FeudView {
  phase: string
  buzzedPlayerId: string | null
  buzzerArmed: boolean
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
  onActed: (update: MatchUpdate) => void
}) {
  const trpc = useTRPC()
  const match = session.activeMatch
  const [wager, setWager] = useState<number | null>(null)

  const act = useMutation(trpc.match.playerAction.mutationOptions({ onSuccess: onActed }))

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
    const gotIt = state.correctPlayerId
      ? session.players.find((player) => player.id === state.correctPlayerId)
      : undefined
    // The latch is what decides, not the phase alone: the room is only live
    // between an arming signal and the first press.
    const canBuzz = state.phase === 'clue' && state.buzzerArmed && !lockedOut

    // The board goes to the phone of whoever holds it, and only theirs: it
    // arriving is how that player learns the pick is theirs. The pack is
    // already on every phone — `session.byCode` carries it — so this is a
    // rendering decision, not a disclosure one.
    const pack = match.pack?.content as JeopardyPack | undefined
    const round = pack?.rounds[state.roundIndex]
    if (state.phase === 'board' && state.controlPlayerId === me.id && round) {
      return (
        <div className="space-y-4">
          <Banner tone="gold">You have the board</Banner>
          <div className="space-y-3">
            {round.categories.map((category, categoryIndex) => (
              <div key={category.name} className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {category.name}
                </p>
                <div
                  className="grid gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${round.values.length}, minmax(0, 1fr))`,
                  }}
                >
                  {round.values.map((_, clueIndex) => {
                    const used = state.usedClues.includes(
                      clueKey(state.roundIndex, categoryIndex, clueIndex),
                    )
                    const missing = !category.clues[clueIndex]
                    return (
                      <button
                        key={`${category.name}-${clueIndex}`}
                        type="button"
                        disabled={used || missing || act.isPending}
                        // No Daily Double marker here, unlike the host's board:
                        // this screen belongs to a player, and the star would
                        // hand them the one thing the phase exists to hide.
                        onClick={() => send({ type: 'select_clue', categoryIndex, clueIndex })}
                        className={cn(
                          'h-12 touch-manipulation rounded-md border font-semibold text-sm tabular-nums transition-transform duration-100',
                          // A spent clue recedes rather than greys: `bg-muted`
                          // is lighter than this surface, so a filled box would
                          // pull the eye towards the squares that are gone.
                          used || missing
                            ? 'border-transparent text-muted-foreground/30'
                            : 'active:scale-95 border-border bg-background text-amber-400',
                        )}
                      >
                        {missing ? '' : formatScore(clueValue(round, clueIndex))}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground text-sm">
            Your score:{' '}
            <span className="font-semibold tabular-nums">{state.scores[me.id] ?? 0}</span>
          </p>
        </div>
      )
    }

    // Final Jeopardy: everyone wagers at once, before the clue appears.
    if (state.phase === 'final_wager') {
      const max = Math.max(0, state.scores[me.id] ?? 0)
      const amount = wager ?? state.wagers[me.id] ?? 0

      if (max === 0) {
        return (
          <div className="space-y-4">
            <Banner tone="muted">Final Jeopardy</Banner>
            <Waiting>
              You need a positive score to wager. Sit this one out and watch the big screen.
            </Waiting>
          </div>
        )
      }

      return (
        <div className="space-y-4">
          <Banner tone="gold">Final Jeopardy — place your wager</Banner>
          <label className="block space-y-1.5">
            <span className="font-medium text-sm">Your wager (up to {max})</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              value={amount}
              onChange={(event) => setWager(Math.max(0, Number(event.target.value) || 0))}
              className="h-16 w-full rounded-md border bg-background px-4 text-center font-semibold text-3xl tabular-nums"
            />
          </label>
          <Button
            size="lg"
            className="h-14 w-full text-lg"
            disabled={act.isPending}
            onClick={() => send({ type: 'set_wager', amount: Math.min(amount, max) })}
          >
            Lock it in
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            Locked in: {state.wagers[me.id] ?? 'nothing yet'}. You can change it until the host
            shows the clue.
          </p>
        </div>
      )
    }

    if (state.phase === 'final_clue' || state.phase === 'final_reveal') {
      const verdict = state.finalResults[me.id]
      return (
        <div className="space-y-4">
          <Banner tone="gold">Final Jeopardy</Banner>
          <p className="text-center text-sm">
            You wagered{' '}
            <span className="font-semibold tabular-nums">{state.wagers[me.id] ?? 0}</span>. Write
            your answer down and watch the big screen.
          </p>
          {verdict !== undefined && (
            <Banner tone={verdict ? 'gold' : 'muted'}>
              {verdict ? 'Correct!' : 'Not this time.'}
            </Banner>
          )}
          <p className="text-center text-muted-foreground text-sm">
            Your score:{' '}
            <span className="font-semibold tabular-nums">{state.scores[me.id] ?? 0}</span>
          </p>
        </div>
      )
    }

    // The Daily Double wager has a phase of its own, and the clue stays hidden
    // through it — this screen is where the number gets decided.
    if (state.phase === 'daily_double') {
      if (!iBuzzed) {
        return <Waiting>Daily Double. Watch the big screen.</Waiting>
      }

      const max = Math.max(state.scores[me.id] ?? 0, state.current?.value ?? 0)
      const amount = wager ?? state.wagers[me.id] ?? state.current?.value ?? 0
      const lockIn = async () => {
        const capped = Math.min(Math.max(0, amount), max)
        // Two actions, in order: the wager has to be recorded before it is
        // locked, or the clue opens with whatever number was there before.
        await act.mutateAsync({
          matchId: match.id,
          token,
          action: { type: 'set_wager', amount: capped },
        })
        await act.mutateAsync({ matchId: match.id, token, action: { type: 'lock_wager' } })
      }

      return (
        <div className="space-y-4">
          <Banner tone="gold">Daily Double — it's yours</Banner>
          <label className="block space-y-1.5">
            <span className="font-medium text-sm">Your wager (up to {max})</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              value={amount}
              onChange={(event) => setWager(Math.max(0, Number(event.target.value) || 0))}
              className="h-16 w-full rounded-md border bg-background px-4 text-center font-semibold text-3xl tabular-nums"
            />
          </label>
          <Button
            size="lg"
            className="h-14 w-full text-lg"
            disabled={act.isPending}
            onClick={() => void lockIn()}
          >
            Lock it in
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            The clue goes up on the big screen once you lock in.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {gotIt && (
          <Banner tone={gotIt.id === me.id ? 'gold' : 'muted'}>
            {gotIt.id === me.id ? 'Correct! Nice one.' : `${gotIt.displayName} got it.`}
          </Banner>
        )}
        {iBuzzed && <Banner tone="gold">You're in — answer!</Banner>}
        {lockedOut && <Banner tone="muted">You're out on this clue.</Banner>}
        {someoneElseBuzzed && <Banner tone="muted">Someone else buzzed first.</Banner>}
        {state.phase === 'clue' && !state.buzzerArmed && !state.buzzedPlayerId && (
          <Banner tone="muted">Buzzers locked. Wait for the host.</Banner>
        )}
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
    const canBuzz = state.phase === 'face_off' && state.buzzerArmed && !state.buzzedPlayerId

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

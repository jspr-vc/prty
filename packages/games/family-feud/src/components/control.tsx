'use client'

import type { MatchContext } from '@workspace/common/game'
import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'
import type { FeudAction } from '../actions'
import { type FeudPack, MAX_STRIKES } from '../content'
import type { FeudState } from '../state'

interface Props {
  pack: FeudPack
  state: FeudState
  ctx: MatchContext
  onAction: (action: FeudAction) => void
  pending?: boolean
}

export function FeudControl({ pack, state, ctx, onAction, pending }: Props) {
  const round = pack.rounds[state.roundIndex]
  if (!round) return null

  const buzzed = ctx.players.find((player) => player.id === state.buzzedPlayerId)
  const buzzedTeam = ctx.teams.find((team) => team.id === buzzed?.teamId)

  return (
    <div className={cn('space-y-6', pending && 'pointer-events-none opacity-60')}>
      <section className="space-y-3">
        <Header>
          Round {state.roundIndex + 1} of {pack.rounds.length} · {round.multiplier}× ·{' '}
          {state.phase.replace('_', ' ')}
        </Header>
        <p className="font-medium text-sm">{round.question}</p>

        {buzzed && (
          <div className="flex items-center gap-2 rounded-md border border-amber-400 bg-amber-50 p-2 dark:bg-amber-950/40">
            <span className="flex-1 text-sm">
              <strong>{buzzed.displayName}</strong> won the face-off
              {buzzedTeam ? ` for ${buzzedTeam.name}` : ''}
            </span>
            {buzzedTeam && (
              <Button
                size="sm"
                onClick={() => onAction({ type: 'set_control', teamId: buzzedTeam.id })}
              >
                Give them control
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onAction({ type: 'clear_buzz' })}>
              Reset
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {round.answers.map((answer, index) => {
            const shown = state.revealed.includes(index)
            return (
              <Button
                key={answer.text}
                variant={shown ? 'secondary' : 'outline'}
                className="w-full justify-between"
                disabled={shown}
                onClick={() => onAction({ type: 'reveal', answerIndex: index })}
              >
                <span className="truncate">
                  {index + 1}. {answer.text}
                </span>
                <span className="tabular-nums">{answer.points}</span>
              </Button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Header>
          Strikes {state.strikes}/{MAX_STRIKES} · Pot {state.pot} (×{round.multiplier} ={' '}
          {state.pot * round.multiplier})
        </Header>

        {/* Three strikes and an unawarded pot are both easy to miss mid-show. */}
        {state.phase === 'play' && state.strikes >= MAX_STRIKES && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-2 text-sm dark:bg-amber-950/40">
            Three strikes. Hand the steal to the other team below.
          </div>
        )}
        {state.phase === 'round_over' && state.pot > 0 && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-2 text-sm dark:bg-amber-950/40">
            {state.pot * round.multiplier} points still on the board — award the pot to a team.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={state.strikes >= MAX_STRIKES && state.phase !== 'steal'}
            onClick={() => onAction({ type: 'strike' })}
          >
            Strike
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction({ type: 'clear_strikes' })}>
            Clear strikes
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <Header>Teams</Header>
        {ctx.teams.length === 0 && (
          <p className="text-muted-foreground text-sm">
            This session has no teams. Add them before starting Family Feud.
          </p>
        )}
        {ctx.teams.map((team) => (
          <div key={team.id} className="flex items-center gap-2 rounded-md border p-2">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <span className="flex-1 truncate text-sm">{team.name}</span>
            <span className="w-16 text-right font-medium text-sm tabular-nums">
              {state.scores[team.id] ?? 0}
            </span>
            <Button
              size="sm"
              variant={state.controlTeamId === team.id ? 'default' : 'outline'}
              onClick={() => onAction({ type: 'set_control', teamId: team.id })}
            >
              Control
            </Button>
            <Button
              size="sm"
              variant={state.stealingTeamId === team.id ? 'default' : 'ghost'}
              onClick={() => onAction({ type: 'start_steal', teamId: team.id })}
            >
              Steal
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAction({ type: 'award_pot', teamId: team.id })}
            >
              Award pot
            </Button>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onAction({ type: 'next_round' })}>
          Next round
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onAction({ type: 'finish' })}>
          Finish
        </Button>
      </section>
    </div>
  )
}

function Header({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      {children}
    </h3>
  )
}

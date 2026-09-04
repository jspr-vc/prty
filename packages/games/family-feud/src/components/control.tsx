'use client'

import type { MatchContext } from '@workspace/common/game'
import { ScoreEditor } from '@workspace/ui/components/score-editor'
import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'
import type { FeudAction } from '../actions'
import { type FeudPack, MAX_STRIKES } from '../content'
import type { FeudState } from '../state'

/** Survey answers are worth single or low double digits, so nudge in fives. */
const SCORE_STEP = 5

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
              <div key={answer.text} className="flex items-center gap-2">
                <Button
                  variant={shown ? 'secondary' : 'outline'}
                  className="w-full flex-1 justify-between"
                  disabled={shown}
                  onClick={() => onAction({ type: 'reveal', answerIndex: index })}
                >
                  <span className="truncate">
                    {index + 1}. {answer.text}
                  </span>
                  <span className="tabular-nums">{answer.points}</span>
                </Button>
                {shown && (
                  // Deliberately a separate control rather than making the row a
                  // toggle: the reveal button is hit fast and often, and a host
                  // double-tapping one would otherwise take their own answer back.
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Hide ${answer.text} again`}
                    title="Turn this answer back over"
                    onClick={() => onAction({ type: 'hide', answerIndex: index })}
                  >
                    Hide
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Header>Face-off</Header>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={state.phase !== 'face_off'}
            onClick={() => onAction({ type: 'strike' })}
          >
            X · not up there
          </Button>
          <Button
            size="sm"
            variant={state.buzzerArmed ? 'outline' : 'default'}
            disabled={state.phase !== 'face_off'}
            onClick={() => onAction({ type: 'set_buzzers_armed', armed: !state.buzzerArmed })}
          >
            {state.buzzerArmed ? 'Lock buzzers' : 'Arm buzzers'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction({ type: 'clear_buzz' })}>
            {state.phase === 'face_off' ? 'New face-off' : 'Clear buzz'}
          </Button>
        </div>

        {state.phase === 'face_off' && state.faceOffMisses > 0 && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-2 text-sm dark:bg-amber-950/40">
            {state.faceOffMisses === 1 ? (
              <>
                One X, and no strike spent. The other contestant answers next. Buzzers are locked,
                so the one who missed cannot take it back.
              </>
            ) : (
              <>
                {state.faceOffMisses} X's and nobody on the board. Start a new face-off, or give a
                team control below and play the round out.
              </>
            )}
          </div>
        )}

        {/*
         * The same button a pad presses, for the nights there are no pads — or
         * when one of them stops answering halfway through a round. The reducer
         * cannot tell the two apart, so a host calling the face-off by eye
         * lands on exactly the state a press would have produced.
         */}
        {ctx.players.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nobody has joined yet. Players can buzz from their phones, or you can buzz for them here
            once they are in.
          </p>
        ) : (
          <div className="space-y-2">
            {ctx.players.map((player) => {
              const team = ctx.teams.find((candidate) => candidate.id === player.teamId)
              return (
                <div key={player.id} className="flex items-center gap-2 rounded-md border p-2">
                  {team && (
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {player.displayName}
                    {team && <span className="text-muted-foreground"> · {team.name}</span>}
                  </span>
                  <Button
                    size="sm"
                    aria-label={`Buzz in ${player.displayName}`}
                    variant={state.buzzedPlayerId === player.id ? 'default' : 'outline'}
                    disabled={
                      state.phase !== 'face_off' ||
                      !state.buzzerArmed ||
                      Boolean(state.buzzedPlayerId)
                    }
                    onClick={() => onAction({ type: 'face_off_buzz', playerId: player.id })}
                  >
                    Buzz
                  </Button>
                </div>
              )
            })}
          </div>
        )}
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
            // The face-off has its own X above, and it is not one of these
            // three: the strike count belongs to whoever ends up with the board.
            disabled={
              state.phase === 'face_off' ||
              (state.strikes >= MAX_STRIKES && state.phase !== 'steal')
            }
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
            <ScoreEditor
              subject={team.name}
              value={state.scores[team.id] ?? 0}
              step={SCORE_STEP}
              onAdjust={(delta) => onAction({ type: 'adjust_score', teamId: team.id, delta })}
              onSet={(value) => onAction({ type: 'set_score', teamId: team.id, value })}
            />
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

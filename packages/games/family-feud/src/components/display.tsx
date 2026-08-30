'use client'

import type { MatchContext } from '@workspace/common/game'
import { useCountUp } from '@workspace/ui/hooks/use-count-up'
import { cn } from '@workspace/ui/lib/utils'
import { type FeudPack, MAX_STRIKES } from '../content'
import type { FeudState } from '../state'

interface Props {
  pack: FeudPack
  state: FeudState
  ctx: MatchContext
}

export function FeudDisplay({ pack, state, ctx }: Props) {
  const round = pack.rounds[state.roundIndex]
  if (state.phase === 'finished') return <FeudResults state={state} ctx={ctx} />
  if (!round) return null

  const buzzed = ctx.players.find((player) => player.id === state.buzzedPlayerId)

  return (
    <div className="flex h-svh flex-col bg-stage text-stage-fg">
      <div className="px-[4vw] pt-[3vh] text-center">
        <p className="stage-label font-semibold text-stage-muted uppercase tracking-[0.3em]">
          Round {state.roundIndex + 1} · {round.multiplier}× · Pot {state.pot * round.multiplier}
        </p>
        <h1
          key={state.roundIndex}
          className="stage-title gs-clue-in mt-3 text-balance font-bold uppercase"
        >
          {round.question}
        </h1>
        {buzzed && (
          <p className="stage-item gs-pop mt-4 font-bold text-stage-accent uppercase tracking-wide">
            {buzzed.displayName} buzzed in
          </p>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center px-[4vw] py-[2vh]">
        <div className="grid h-[58vh] w-[84vw] auto-rows-fr grid-cols-1 gap-[1.4vh] sm:grid-cols-2">
          {round.answers.map((answer, index) => {
            const shown = state.revealed.includes(index)
            return (
              <div
                key={answer.text}
                className={cn(
                  'stage-item flex items-center justify-between gap-[2vw] rounded-lg border px-[2.5vw] py-[1.5vh] font-bold uppercase',
                  shown
                    ? 'gs-flip-in border-stage-accent/30 bg-stage-panel-hi'
                    : 'border-stage-line bg-stage-panel text-stage-fg/20',
                )}
              >
                <span className="flex min-w-0 items-center gap-[1.2vw] text-balance">
                  <span className="shrink-0 text-stage-muted">{index + 1}</span>
                  {shown ? answer.text : '—'}
                </span>
                <span className="shrink-0 tabular-nums">{shown ? answer.points : ''}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-[1vw] pb-[2vh]">
        {Array.from({ length: MAX_STRIKES }, (_, index) => (
          <span
            key={index}
            className={cn(
              'stage-strike flex items-center justify-center rounded-md border-4 font-bold',
              index < state.strikes
                ? 'gs-pop border-stage-danger bg-stage-danger/15 text-stage-danger'
                : 'border-stage-line text-transparent',
            )}
          >
            X
          </span>
        ))}
      </div>

      <div className="grid shrink-0 grid-flow-col gap-px border-stage-line border-t bg-stage-line">
        {ctx.teams.map((team) => (
          <TeamScore
            key={team.id}
            name={team.name}
            color={team.color}
            value={state.scores[team.id] ?? 0}
            status={
              state.stealingTeamId === team.id
                ? 'steal'
                : state.controlTeamId === team.id
                  ? 'control'
                  : null
            }
          />
        ))}
      </div>
    </div>
  )
}

function TeamScore({
  name,
  color,
  value,
  status,
}: {
  name: string
  color: string
  value: number
  status: 'control' | 'steal' | null
}) {
  const shown = useCountUp(value)

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1 bg-stage px-[2vw] py-[1.8vh] transition-colors duration-300',
        status && 'bg-stage-panel-hi',
        status === 'steal' && 'gs-buzzed',
      )}
      // On a near-black stage a slightly lighter panel is invisible from a sofa,
      // so the team's own colour does the work instead.
      style={{ borderTop: `${status ? '0.6vh' : '0.25vh'} solid ${color}` }}
    >
      <span className="stage-label font-medium uppercase tracking-wide">{name}</span>
      <span className="stage-score font-bold tabular-nums">{shown}</span>
      {status && (
        <span
          className="stage-caption gs-pop absolute top-[0.6vh] right-[1vw] font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {status === 'steal' ? 'Steal' : 'Control'}
        </span>
      )}
    </div>
  )
}

function FeudResults({ state, ctx }: { state: FeudState; ctx: MatchContext }) {
  const ranked = [...ctx.teams].sort(
    (a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0),
  )
  const top = ranked[0] ? (state.scores[ranked[0].id] ?? 0) : 0
  const winners = ranked.filter((team) => (state.scores[team.id] ?? 0) === top)
  const tied = winners.length > 1 && ranked.length > 1

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-[4vh] bg-stage px-[6vw] text-stage-fg">
      <p className="stage-label gs-rise font-semibold text-stage-muted uppercase tracking-[0.3em]">
        Final scores
      </p>

      <div className="flex w-full flex-col gap-[2vh]">
        {ranked.map((team, index) => {
          const won = winners.includes(team)
          return (
            <div
              key={team.id}
              className={cn(
                'gs-rise flex items-center justify-between gap-[3vw] rounded-lg border px-[3vw] py-[2.5vh]',
                won ? 'border-stage-accent bg-stage-panel-hi' : 'border-stage-line bg-stage-panel',
              )}
              style={{
                animationDelay: `${index * 90}ms`,
                borderLeftWidth: '0.6vw',
                borderLeftColor: team.color,
              }}
            >
              <span className="stage-title min-w-0 truncate font-bold uppercase">{team.name}</span>
              <span
                className={cn(
                  'stage-display shrink-0 font-bold tabular-nums',
                  won && 'text-stage-accent',
                )}
              >
                {state.scores[team.id] ?? 0}
              </span>
            </div>
          )
        })}
      </div>

      <p className="stage-title gs-pop font-bold text-stage-accent uppercase tracking-wide">
        {tied ? `Tied at ${top}` : winners[0] ? `${winners[0].name} wins` : 'No teams played'}
      </p>
    </div>
  )
}

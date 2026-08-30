'use client'

import type { MatchContext } from '@workspace/common/game'
import { formatScore } from '@workspace/common/utils'
import { useCountUp } from '@workspace/ui/hooks/use-count-up'
import { cn } from '@workspace/ui/lib/utils'
import { clueKey, clueValue, type JeopardyPack } from '../content'
import type { JeopardyState } from '../state'

interface Props {
  pack: JeopardyPack
  state: JeopardyState
  ctx: MatchContext
}

export function JeopardyDisplay({ pack, state, ctx }: Props) {
  const round = pack.rounds[state.roundIndex]
  const buzzed = ctx.players.find((player) => player.id === state.buzzedPlayerId)
  const current =
    state.current && round
      ? round.categories[state.current.categoryIndex]?.clues[state.current.clueIndex]
      : null

  return (
    <div className="flex h-svh flex-col bg-stage text-stage-fg">
      <div className="flex-1 overflow-hidden p-[2vw]">
        {state.phase === 'finished' ? (
          <Centered title="Final scores" />
        ) : state.phase.startsWith('final') ? (
          <Centered
            title={state.phase === 'final_reveal' ? pack.final.answer : pack.final.clue}
            eyebrow={`Final Jeopardy — ${pack.final.category}`}
          />
        ) : state.current && current ? (
          <Centered
            key={`${state.current.categoryIndex}:${state.current.clueIndex}:${state.phase}`}
            title={state.phase === 'revealed' ? current.answer : current.clue}
            eyebrow={
              state.current.dailyDouble
                ? 'Daily Double'
                : `${round?.categories[state.current.categoryIndex]?.name ?? ''} — ${formatScore(state.current.value)}`
            }
            footer={buzzed ? `${buzzed.displayName} buzzed in` : undefined}
          />
        ) : round ? (
          <Board round={round} roundIndex={state.roundIndex} usedClues={state.usedClues} />
        ) : null}
      </div>

      <Scoreboard state={state} ctx={ctx} />
    </div>
  )
}

function Board({
  round,
  roundIndex,
  usedClues,
}: {
  round: JeopardyPack['rounds'][number]
  roundIndex: number
  usedClues: string[]
}) {
  const rows = round.values.length

  return (
    <div
      className="grid h-full gap-2"
      style={{ gridTemplateColumns: `repeat(${round.categories.length}, minmax(0, 1fr))` }}
    >
      {round.categories.map((category, categoryIndex) => (
        <div
          key={category.name}
          className="grid gap-2"
          style={{ gridTemplateRows: `auto repeat(${rows}, minmax(0, 1fr))` }}
        >
          <div className="stage-label flex items-center justify-center rounded-sm border border-stage-line bg-stage-panel-hi p-3 text-center font-bold text-stage-muted uppercase tracking-wide">
            {category.name}
          </div>
          {Array.from({ length: rows }, (_, clueIndex) => {
            const used = usedClues.includes(clueKey(roundIndex, categoryIndex, clueIndex))
            const exists = Boolean(category.clues[clueIndex])
            return (
              <div
                key={`${category.name}-${clueIndex}`}
                className={cn(
                  'stage-value flex items-center justify-center rounded-sm border border-stage-line bg-stage-panel font-bold text-stage-accent transition-colors duration-500',
                  (used || !exists) && 'border-transparent bg-stage-panel/40 text-transparent',
                )}
              >
                {formatScore(clueValue(round, clueIndex))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function Centered({
  title,
  eyebrow,
  footer,
}: {
  title: string
  eyebrow?: string
  footer?: string
}) {
  return (
    <div className="gs-clue-in flex h-full flex-col items-center justify-center gap-6 text-center">
      {eyebrow && (
        <p className="stage-label font-semibold text-stage-accent uppercase tracking-[0.2em]">
          {eyebrow}
        </p>
      )}
      <p className="stage-display max-w-[85vw] max-w-6xl text-balance font-bold uppercase">
        {title}
      </p>
      {footer && <p className="stage-item text-stage-muted">{footer}</p>}
    </div>
  )
}

function Scoreboard({ state, ctx }: { state: JeopardyState; ctx: MatchContext }) {
  return (
    <div className="grid shrink-0 grid-flow-col gap-px border-stage-line border-t bg-stage-line">
      {ctx.players.map((player) => (
        <PlayerScore
          key={player.id}
          name={player.displayName}
          value={state.scores[player.id] ?? 0}
          hasControl={state.controlPlayerId === player.id}
          buzzed={state.buzzedPlayerId === player.id}
        />
      ))}
    </div>
  )
}

function PlayerScore({
  name,
  value,
  hasControl,
  buzzed,
}: {
  name: string
  value: number
  hasControl: boolean
  buzzed: boolean
}) {
  const shown = useCountUp(value)

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 bg-stage px-[1.5vw] py-[1.8vh] transition-colors duration-300',
        hasControl && 'bg-stage-panel',
        buzzed && 'gs-buzzed bg-stage-accent text-stage-accent-fg',
      )}
    >
      <span className="stage-label font-medium uppercase tracking-wide">{name}</span>
      <span className={cn('stage-score font-bold tabular-nums', shown < 0 && 'text-stage-danger')}>
        {formatScore(shown)}
      </span>
    </div>
  )
}

'use client'

import type { MatchContext } from '@workspace/common/game'
import { formatScore } from '@workspace/common/utils'
import { useCountUp } from '@workspace/ui/hooks/use-count-up'
import { cn } from '@workspace/ui/lib/utils'
import { clueKey, clueValue, type JeopardyPack } from '../content'
import { clueStake } from '../reducer'
import type { JeopardyState } from '../state'

interface Props {
  pack: JeopardyPack
  state: JeopardyState
  ctx: MatchContext
}

export function JeopardyDisplay({ pack, state, ctx }: Props) {
  const round = pack.rounds[state.roundIndex]
  const buzzed = ctx.players.find((player) => player.id === state.buzzedPlayerId)
  const correct = ctx.players.find((player) => player.id === state.correctPlayerId)
  const wagering = state.buzzedPlayerId ? state.wagers[state.buzzedPlayerId] : undefined
  const current =
    state.current && round
      ? round.categories[state.current.categoryIndex]?.clues[state.current.clueIndex]
      : null

  return (
    <div className="flex h-svh flex-col bg-stage text-stage-fg">
      <div className="flex-1 overflow-hidden p-[2vw]">
        {state.phase === 'finished' ? (
          <Centered title="Final scores" />
        ) : state.phase === 'final_wager' ? (
          <FinalWager category={pack.final.category} state={state} ctx={ctx} />
        ) : state.phase === 'final_reveal' ? (
          <FinalReveal
            answer={pack.final.answer}
            category={pack.final.category}
            state={state}
            ctx={ctx}
          />
        ) : state.phase.startsWith('final') ? (
          <Centered title={pack.final.clue} eyebrow={`Final Jeopardy — ${pack.final.category}`} />
        ) : state.phase === 'daily_double' ? (
          <DailyDouble name={buzzed?.displayName} wager={wagering} />
        ) : state.current && current ? (
          <Centered
            key={`${state.current.categoryIndex}:${state.current.clueIndex}:${state.phase}`}
            title={state.phase === 'revealed' ? current.answer : current.clue}
            eyebrow={
              state.current.dailyDouble
                ? 'Daily Double'
                : `${round?.categories[state.current.categoryIndex]?.name ?? ''} — ${formatScore(state.current.value)}`
            }
            footer={
              correct ? (
                <Correct name={correct.displayName} amount={clueStake(state)} />
              ) : buzzed ? (
                `${buzzed.displayName} buzzed in`
              ) : undefined
            }
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

/**
 * Final Jeopardy's wager screen: the category and nothing else.
 *
 * The clue must not be here. It used to be — `phase.startsWith('final')` swept
 * the wager phase in with the clue phase — which let the room read the question
 * before deciding what to risk on it, and that is the entire game.
 *
 * Nor are the amounts. Unlike a Daily Double, where one player wagers out loud
 * and the host repeats it, final wagers are secret until the reveal. So the
 * board shows only *who* has locked in, which is what the host needs to know
 * before moving on.
 */
function FinalWager({
  category,
  state,
  ctx,
}: {
  category: string
  state: JeopardyState
  ctx: MatchContext
}) {
  return (
    <div className="gs-clue-in flex h-full flex-col items-center justify-center gap-[4vh] text-center">
      <p className="stage-label font-semibold text-stage-accent uppercase tracking-[0.2em]">
        Final Jeopardy
      </p>
      <p className="stage-display text-balance font-bold uppercase">{category}</p>
      <p className="stage-item text-stage-muted">Place your wagers</p>

      <ul className="flex flex-wrap items-center justify-center gap-[1.5vw]">
        {ctx.players.map((player) => {
          const locked = state.wagers[player.id] !== undefined
          return (
            <li
              key={player.id}
              className={cn(
                'stage-item rounded-lg border px-[2vw] py-[1.2vh] font-semibold transition-colors duration-300',
                locked
                  ? 'gs-pop border-stage-accent bg-stage-panel-hi text-stage-accent'
                  : 'border-stage-line bg-stage-panel text-stage-muted',
              )}
            >
              {player.displayName}
              <span className="stage-caption block font-normal uppercase tracking-wide">
                {locked ? 'locked in' : 'deciding…'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * The wager screen. The clue is deliberately not on it: a Daily Double is
 * wagered blind, and putting the text up while the player decides how much to
 * risk gives the whole thing away.
 */
function DailyDouble({ name, wager }: { name?: string; wager?: number }) {
  return (
    <div className="gs-clue-in flex h-full flex-col items-center justify-center gap-8 text-center">
      <p className="stage-display font-bold text-stage-accent uppercase tracking-tight">
        Daily Double
      </p>
      {name && <p className="stage-title font-semibold">{name}, what's your wager?</p>}
      {wager !== undefined && (
        <p className="stage-value gs-pop font-bold tabular-nums">{formatScore(wager)}</p>
      )}
    </div>
  )
}

/**
 * Who just took the clue.
 *
 * The reveal screen otherwise says only what the answer was, and the room is
 * left to work out from a score that ticked up which of four people said it.
 */
function Correct({ name, amount }: { name: string; amount: number }) {
  return (
    <span className="gs-pop inline-flex items-center gap-[1vw] rounded-full border border-stage-success bg-stage-success px-[2vw] py-[1vh] text-stage-success-fg">
      <span className="font-bold uppercase tracking-wide">{name} is correct</span>
      <span className="font-bold tabular-nums">+{formatScore(amount)}</span>
    </span>
  )
}

/**
 * Final Jeopardy's reveal: the answer, and then who got there.
 *
 * Wagers are secret right up to this screen, so this is the first and only
 * place they belong on the big screen.
 */
function FinalReveal({
  answer,
  category,
  state,
  ctx,
}: {
  answer: string
  category: string
  state: JeopardyState
  ctx: MatchContext
}) {
  return (
    <div className="gs-clue-in flex h-full flex-col items-center justify-center gap-[3vh] text-center">
      <p className="stage-label font-semibold text-stage-accent uppercase tracking-[0.2em]">
        Final Jeopardy — {category}
      </p>
      <p className="stage-display max-w-[85vw] text-balance font-bold uppercase">{answer}</p>

      <ul className="flex flex-wrap items-center justify-center gap-[1.5vw]">
        {ctx.players.map((player) => {
          const verdict = state.finalResults[player.id]
          const wager = state.wagers[player.id] ?? 0
          return (
            <li
              key={player.id}
              className={cn(
                'stage-item rounded-lg border px-[2vw] py-[1.2vh] font-semibold transition-colors duration-300',
                verdict === true &&
                  'gs-pop border-stage-success bg-stage-success text-stage-success-fg',
                verdict === false && 'border-stage-danger text-stage-danger',
                verdict === undefined && 'border-stage-line bg-stage-panel text-stage-muted',
              )}
            >
              {player.displayName}
              <span className="stage-caption block font-normal uppercase tracking-wide">
                {verdict === undefined
                  ? 'judging…'
                  : `${verdict ? 'correct' : 'incorrect'} · ${verdict ? '+' : '−'}${formatScore(wager)}`}
              </span>
            </li>
          )
        })}
      </ul>
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
  footer?: React.ReactNode
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
      {footer && <div className="stage-item text-stage-muted">{footer}</div>}
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
          correct={
            state.correctPlayerId === player.id ||
            (state.phase === 'final_reveal' && state.finalResults[player.id] === true)
          }
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
  correct,
}: {
  name: string
  value: number
  hasControl: boolean
  buzzed: boolean
  correct: boolean
}) {
  const shown = useCountUp(value)

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 bg-stage px-[1.5vw] py-[1.8vh] transition-colors duration-300',
        hasControl && 'bg-stage-panel',
        // A verdict outranks the panel tint: the room is looking for who got it.
        correct && 'gs-pop bg-stage-success text-stage-success-fg',
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

'use client'

import type { MatchContext } from '@workspace/common/game'
import { formatScore } from '@workspace/common/utils'
import { ScoreEditor } from '@workspace/ui/components/score-editor'
import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'
import type { JeopardyAction } from '../actions'
import { clueKey, clueValue, type JeopardyPack } from '../content'
import { maxFinalWager, maxWager } from '../reducer'
import type { JeopardyState } from '../state'

interface Props {
  pack: JeopardyPack
  state: JeopardyState
  ctx: MatchContext
  onAction: (action: JeopardyAction) => void
  pending?: boolean
}

export function JeopardyControl({ pack, state, ctx, onAction, pending }: Props) {
  const round = pack.rounds[state.roundIndex]
  const current =
    state.current && round
      ? round.categories[state.current.categoryIndex]?.clues[state.current.clueIndex]
      : null
  const wagerPlayerId = state.buzzedPlayerId ?? state.controlPlayerId
  const correct = ctx.players.find((player) => player.id === state.correctPlayerId)
  // One tap is worth the cheapest clue on the board, which is the smallest
  // correction that ever makes sense in this round.
  const scoreStep = round ? Math.min(...round.values) : 100

  return (
    <div className={cn('space-y-6', pending && 'pointer-events-none opacity-60')}>
      <section className="space-y-3">
        <Header>
          {round?.name ?? 'Final'} · {state.phase.replace('_', ' ')}
        </Header>

        {state.phase === 'board' && round && (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${round.categories.length}, minmax(0, 1fr))` }}
          >
            {round.categories.map((category, categoryIndex) => (
              <div key={category.name} className="space-y-2">
                <p className="truncate text-center font-medium text-muted-foreground text-xs uppercase">
                  {category.name}
                </p>
                {category.clues.map((clue, clueIndex) => {
                  const used = state.usedClues.includes(
                    clueKey(state.roundIndex, categoryIndex, clueIndex),
                  )
                  return (
                    <Button
                      key={`${category.name}-${clueIndex}`}
                      variant={used ? 'ghost' : 'outline'}
                      size="sm"
                      className="w-full"
                      disabled={used}
                      onClick={() => onAction({ type: 'select_clue', categoryIndex, clueIndex })}
                    >
                      {formatScore(clueValue(round, clueIndex))}
                      {clue.dailyDouble && !used && ' ★'}
                    </Button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {current && (
          <div className="space-y-3 rounded-lg border p-4">
            {state.phase === 'daily_double' && (
              <p className="font-medium text-amber-400 text-xs uppercase tracking-wide">
                Daily Double — the big screen is showing the wager, not this
              </p>
            )}
            <p className="text-sm">{current.clue}</p>
            <p className="font-medium text-sm">Answer: {current.answer}</p>

            {correct && (
              <p className="font-medium text-emerald-400 text-xs uppercase tracking-wide">
                {correct.displayName} answered correctly
              </p>
            )}

            {state.current?.dailyDouble && wagerPlayerId && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  Wager (max {formatScore(maxWager(state, pack, wagerPlayerId))})
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-8 w-28 rounded-md border bg-background px-2"
                    value={state.wagers[wagerPlayerId] ?? state.current.value}
                    onChange={(event) =>
                      onAction({
                        type: 'set_wager',
                        playerId: wagerPlayerId,
                        amount: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                </label>
                {state.phase === 'daily_double' && (
                  <Button size="sm" onClick={() => onAction({ type: 'lock_wager' })}>
                    Lock wager & show clue
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {state.phase === 'buzzed' && (
                <>
                  <Button size="sm" onClick={() => onAction({ type: 'judge', correct: true })}>
                    Correct
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onAction({ type: 'judge', correct: false })}
                  >
                    Incorrect
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAction({ type: 'clear_buzz' })}
                  >
                    Clear buzz
                  </Button>
                </>
              )}
              {state.phase === 'clue' && (
                <>
                  <Button
                    size="sm"
                    variant={state.buzzerArmed ? 'outline' : 'default'}
                    onClick={() =>
                      onAction({ type: 'set_buzzers_armed', armed: !state.buzzerArmed })
                    }
                  >
                    {state.buzzerArmed ? 'Lock buzzers' : 'Arm buzzers'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onAction({ type: 'reveal_answer' })}
                  >
                    Nobody got it
                  </Button>
                </>
              )}
              {state.phase === 'revealed' && (
                <Button size="sm" onClick={() => onAction({ type: 'return_to_board' })}>
                  Back to board
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Header>Players</Header>
        <div className="space-y-2">
          {ctx.players.map((player) => (
            <div key={player.id} className="flex items-center gap-2 rounded-md border p-2">
              <span className="flex-1 truncate text-sm">{player.displayName}</span>
              <Button
                size="sm"
                aria-label={`Buzz in ${player.displayName}`}
                variant={state.buzzedPlayerId === player.id ? 'default' : 'outline'}
                disabled={
                  state.phase !== 'clue' ||
                  !state.buzzerArmed ||
                  state.lockedOut.includes(player.id)
                }
                onClick={() => onAction({ type: 'buzz', playerId: player.id })}
              >
                Buzz
              </Button>
              <Button
                size="sm"
                aria-label={`Give control to ${player.displayName}`}
                variant={state.controlPlayerId === player.id ? 'default' : 'ghost'}
                onClick={() => onAction({ type: 'set_control', playerId: player.id })}
              >
                Control
              </Button>
              <ScoreEditor
                subject={player.displayName}
                value={state.scores[player.id] ?? 0}
                step={scoreStep}
                format={formatScore}
                onAdjust={(delta) => onAction({ type: 'adjust_score', playerId: player.id, delta })}
                onSet={(value) => onAction({ type: 'set_score', playerId: player.id, value })}
              />
            </div>
          ))}
        </div>
      </section>

      {state.phase.startsWith('final') && state.phase !== 'finished' && (
        <section className="space-y-3 rounded-lg border border-amber-500/40 p-4">
          <Header>Final Jeopardy · {pack.final.category}</Header>
          <p className="text-sm">{pack.final.clue}</p>
          <p className="font-medium text-sm">Answer: {pack.final.answer}</p>

          <div className="space-y-2">
            {ctx.players.map((player) => {
              const verdict = state.finalResults[player.id]
              const ceiling = maxFinalWager(state, player.id)
              return (
                <div
                  key={player.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border p-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{player.displayName}</span>
                  <label className="flex items-center gap-1 text-xs">
                    Wager (max {formatScore(ceiling)})
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={ceiling}
                      disabled={state.phase !== 'final_wager'}
                      className="h-8 w-28 rounded-md border bg-background px-2 disabled:opacity-50"
                      value={state.wagers[player.id] ?? 0}
                      onChange={(event) =>
                        onAction({
                          type: 'set_wager',
                          playerId: player.id,
                          amount: Math.max(0, Number(event.target.value) || 0),
                        })
                      }
                    />
                  </label>
                  <Button
                    size="sm"
                    // Nobody has answered yet while the wagers are still going in.
                    disabled={state.phase === 'final_wager'}
                    variant={verdict === true ? 'default' : 'outline'}
                    onClick={() =>
                      onAction({ type: 'judge_final', playerId: player.id, correct: true })
                    }
                  >
                    Correct
                  </Button>
                  <Button
                    size="sm"
                    disabled={state.phase === 'final_wager'}
                    variant={verdict === false ? 'destructive' : 'outline'}
                    onClick={() =>
                      onAction({ type: 'judge_final', playerId: player.id, correct: false })
                    }
                  >
                    Incorrect
                  </Button>
                </div>
              )
            })}
          </div>

          <p className="text-muted-foreground text-xs">
            Wagers lock once the clue is shown. Judging pays one out immediately, and changing a
            verdict undoes the previous one rather than paying twice — so a misclick is safe to
            correct. Use a player's score box for anything else.
          </p>
        </section>
      )}

      <section className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={state.roundIndex + 1 >= pack.rounds.length}
          onClick={() => onAction({ type: 'next_round' })}
        >
          Next round
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onAction({ type: 'start_final' })}>
          Final Jeopardy
        </Button>
        {(state.phase === 'final_wager' || state.phase === 'final_clue') && (
          <Button variant="secondary" size="sm" onClick={() => onAction({ type: 'reveal_final' })}>
            {state.phase === 'final_wager' ? 'Show the clue' : 'Show the answer'}
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={() => onAction({ type: 'finish' })}>
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

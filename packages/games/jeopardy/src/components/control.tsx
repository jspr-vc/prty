'use client'

import type { MatchContext } from '@workspace/common/game'
import { formatScore } from '@workspace/common/utils'
import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'
import type { JeopardyAction } from '../actions'
import { clueKey, clueValue, type JeopardyPack } from '../content'
import { maxWager } from '../reducer'
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
            <p className="text-sm">{current.clue}</p>
            <p className="font-medium text-sm">Answer: {current.answer}</p>

            {state.current?.dailyDouble && wagerPlayerId && (
              <label className="flex items-center gap-2 text-sm">
                Wager (max {formatScore(maxWager(state, pack, wagerPlayerId))})
                <input
                  type="number"
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
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onAction({ type: 'reveal_answer' })}
                >
                  Nobody got it
                </Button>
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
              <span className="w-20 text-right font-medium text-sm tabular-nums">
                {formatScore(state.scores[player.id] ?? 0)}
              </span>
              <Button
                size="sm"
                aria-label={`Buzz in ${player.displayName}`}
                variant={state.buzzedPlayerId === player.id ? 'default' : 'outline'}
                disabled={state.phase !== 'clue' || state.lockedOut.includes(player.id)}
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
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Subtract 100 from ${player.displayName}`}
                onClick={() => onAction({ type: 'adjust_score', playerId: player.id, delta: -100 })}
              >
                −
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Add 100 to ${player.displayName}`}
                onClick={() => onAction({ type: 'adjust_score', playerId: player.id, delta: 100 })}
              >
                +
              </Button>
            </div>
          ))}
        </div>
      </section>

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
        {state.phase.startsWith('final') && state.phase !== 'final_reveal' && (
          <Button variant="secondary" size="sm" onClick={() => onAction({ type: 'reveal_final' })}>
            Advance final
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

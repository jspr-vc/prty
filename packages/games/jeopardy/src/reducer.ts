import type { MatchContext, NarrationLine } from '@workspace/common/game'
import { formatScore } from '@workspace/common/utils'
import { type JeopardyAction, jeopardyPlayerActionSchema } from './actions'
import { clueKey, clueValue, type JeopardyPack } from './content'
import type { JeopardyState } from './state'

export function createJeopardyState(_pack: JeopardyPack, ctx: MatchContext): JeopardyState {
  return {
    phase: 'board',
    roundIndex: 0,
    usedClues: [],
    current: null,
    buzzedPlayerId: null,
    buzzerArmed: false,
    lockedOut: [],
    correctPlayerId: null,
    wagers: {},
    finalResults: {},
    scores: Object.fromEntries(ctx.players.map((player) => [player.id, 0])),
    controlPlayerId: ctx.players[0]?.id ?? null,
  }
}

function score(state: JeopardyState, playerId: string): number {
  return state.scores[playerId] ?? 0
}

/**
 * What the current clue is worth to whoever is on it: the wager on a daily
 * double, the face value otherwise.
 *
 * Exported because the reveal screen needs the same number to say what a
 * correct answer just paid, and a second copy of this rule would drift.
 */
export function clueStake(state: JeopardyState): number {
  if (!state.current) return 0
  if (!state.current.dailyDouble) return state.current.value
  const player = state.buzzedPlayerId ?? state.controlPlayerId
  return player ? (state.wagers[player] ?? state.current.value) : state.current.value
}

export function reduceJeopardy(
  pack: JeopardyPack,
  state: JeopardyState,
  action: JeopardyAction,
  ctx: MatchContext,
): JeopardyState {
  const round = pack.rounds[state.roundIndex]

  switch (action.type) {
    case 'select_clue': {
      if (state.phase !== 'board' || !round) return state
      const category = round.categories[action.categoryIndex]
      const clue = category?.clues[action.clueIndex]
      if (!clue) return state

      const key = clueKey(state.roundIndex, action.categoryIndex, action.clueIndex)
      if (state.usedClues.includes(key)) return state

      const current = {
        categoryIndex: action.categoryIndex,
        clueIndex: action.clueIndex,
        value: clueValue(round, action.clueIndex),
        dailyDouble: clue.dailyDouble,
      }

      // Only the player in control plays a Daily Double, so there is nobody to
      // buzz: it goes straight to a wager, with the clue still hidden.
      if (clue.dailyDouble && state.controlPlayerId) {
        const wagers = { ...state.wagers }
        // Drop any wager left over from a previous Daily Double, or the input
        // opens pre-filled with a number from a different clue entirely.
        delete wagers[state.controlPlayerId]
        return {
          ...state,
          phase: 'daily_double',
          current,
          buzzedPlayerId: state.controlPlayerId,
          buzzerArmed: false,
          lockedOut: [],
          correctPlayerId: null,
          wagers,
        }
      }

      return {
        ...state,
        phase: 'clue',
        current,
        buzzedPlayerId: null,
        // A new clue is one of the four signals that re-arm the room.
        buzzerArmed: true,
        lockedOut: [],
        correctPlayerId: null,
      }
    }

    case 'lock_wager': {
      if (state.phase !== 'daily_double') return state
      // Straight to `buzzed`: the wagering player is already on the hook, and
      // this is the moment the clue becomes readable.
      return { ...state, phase: 'buzzed' }
    }

    case 'buzz': {
      // The latch, not `buzzedPlayerId`, is what decides. Two pads pressed in
      // the same millisecond both reach a reducer that runs on one serialised
      // queue, and the second one finds the room disarmed.
      if (state.phase !== 'clue' || !state.buzzerArmed) return state
      if (state.buzzedPlayerId) return state
      if (state.lockedOut.includes(action.playerId)) return state
      if (!ctx.players.some((player) => player.id === action.playerId)) return state
      return { ...state, phase: 'buzzed', buzzedPlayerId: action.playerId, buzzerArmed: false }
    }

    case 'clear_buzz': {
      // The reset pad. It re-arms from either side of a buzz, so a host who
      // hits it twice does not end up with a locked room.
      if (state.phase === 'buzzed') {
        return { ...state, phase: 'clue', buzzedPlayerId: null, buzzerArmed: true }
      }
      if (state.phase === 'clue' && (!state.buzzerArmed || state.buzzedPlayerId)) {
        return { ...state, buzzedPlayerId: null, buzzerArmed: true }
      }
      return state
    }

    case 'set_buzzers_armed': {
      // Lets the host hold the room while they finish reading a clue out loud.
      if (state.phase !== 'clue') return state
      if (state.buzzerArmed === action.armed) return state
      return { ...state, buzzerArmed: action.armed }
    }

    case 'judge': {
      const playerId = state.buzzedPlayerId
      if (!playerId || !state.current) return state
      if (state.phase !== 'buzzed') return state
      const amount = clueStake(state)

      if (action.correct) {
        return {
          ...state,
          phase: 'revealed',
          scores: { ...state.scores, [playerId]: score(state, playerId) + amount },
          controlPlayerId: playerId,
          buzzedPlayerId: null,
          buzzerArmed: false,
          // The verdict clears the buzz, so who was right is recorded here for
          // the reveal screen to show.
          correctPlayerId: playerId,
        }
      }

      const lockedOut = [...state.lockedOut, playerId]
      const everyoneLockedOut = lockedOut.length >= ctx.players.length
      // A missed daily double belongs to one player only, so it ends immediately.
      const over = state.current.dailyDouble || everyoneLockedOut
      return {
        ...state,
        phase: over ? 'revealed' : 'clue',
        scores: { ...state.scores, [playerId]: score(state, playerId) - amount },
        buzzedPlayerId: null,
        // A wrong answer is the steal signal: the clue reopens and the rest of
        // the room may buzz again.
        buzzerArmed: !over,
        lockedOut,
      }
    }

    case 'reveal_answer':
      return state.phase === 'clue' || state.phase === 'buzzed'
        ? {
            ...state,
            phase: 'revealed',
            buzzedPlayerId: null,
            buzzerArmed: false,
            correctPlayerId: null,
          }
        : state

    case 'return_to_board': {
      if (state.phase !== 'revealed' || !state.current) return state
      const key = clueKey(state.roundIndex, state.current.categoryIndex, state.current.clueIndex)
      return {
        ...state,
        phase: 'board',
        usedClues: state.usedClues.includes(key) ? state.usedClues : [...state.usedClues, key],
        current: null,
        buzzedPlayerId: null,
        buzzerArmed: false,
        lockedOut: [],
        correctPlayerId: null,
      }
    }

    case 'set_wager': {
      if (!ctx.players.some((player) => player.id === action.playerId)) return state
      // A final wager is locked the moment the clue goes up. That is the rule,
      // and it also stops a wager shifting underneath a verdict that has
      // already paid out. The host's score editor remains the escape hatch.
      if (state.phase === 'final_clue' || state.phase === 'final_reveal') return state
      // Clamped here rather than only in the two UIs that offer the input: a
      // phone posts straight to the API, and "wager one million" should not be
      // a thing a player can simply ask for.
      const ceiling =
        state.phase === 'final_wager'
          ? maxFinalWager(state, action.playerId)
          : maxWager(state, pack, action.playerId)
      const amount = Math.max(0, Math.min(action.amount, ceiling))
      if (state.wagers[action.playerId] === amount) return state
      return { ...state, wagers: { ...state.wagers, [action.playerId]: amount } }
    }

    case 'judge_final': {
      // Only once the clue has been shown: there is nothing to judge while the
      // room is still deciding what to risk.
      if (state.phase !== 'final_clue' && state.phase !== 'final_reveal') return state
      if (!ctx.players.some((player) => player.id === action.playerId)) return state

      const previous = state.finalResults[action.playerId]
      if (previous === action.correct) return state

      const wager = state.wagers[action.playerId] ?? 0
      // Undo whatever the last verdict paid out before paying the new one, so
      // a host correcting a mistake lands on the right number rather than
      // double-counting the wager.
      const undo = previous === undefined ? 0 : previous ? -wager : wager
      const applied = action.correct ? wager : -wager

      return {
        ...state,
        scores: {
          ...state.scores,
          [action.playerId]: score(state, action.playerId) + undo + applied,
        },
        finalResults: { ...state.finalResults, [action.playerId]: action.correct },
      }
    }

    case 'set_control':
      return { ...state, controlPlayerId: action.playerId }

    case 'adjust_score': {
      if (action.delta === 0) return state
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.playerId]: score(state, action.playerId) + action.delta,
        },
      }
    }

    case 'set_score': {
      if (!ctx.players.some((player) => player.id === action.playerId)) return state
      // Rejecting a no-op keeps a host who retypes the number they already had
      // from writing an event and waking the room.
      if (score(state, action.playerId) === action.value) return state
      return { ...state, scores: { ...state.scores, [action.playerId]: action.value } }
    }

    case 'next_round': {
      const nextIndex = state.roundIndex + 1
      if (nextIndex >= pack.rounds.length) return state
      return {
        ...state,
        phase: 'board',
        roundIndex: nextIndex,
        current: null,
        buzzedPlayerId: null,
        buzzerArmed: false,
        lockedOut: [],
        correctPlayerId: null,
      }
    }

    case 'start_final':
      return {
        ...state,
        phase: 'final_wager',
        current: null,
        buzzedPlayerId: null,
        buzzerArmed: false,
        lockedOut: [],
        correctPlayerId: null,
        // A daily double's wager would otherwise carry straight into the final
        // and pre-fill everyone's box with a number from a different clue.
        wagers: {},
        finalResults: {},
      }

    case 'reveal_final':
      if (state.phase === 'final_wager') return { ...state, phase: 'final_clue' }
      if (state.phase === 'final_clue') return { ...state, phase: 'final_reveal' }
      return state

    case 'finish':
      return { ...state, phase: 'finished', buzzerArmed: false }
  }
}

/** Highest wager a player may place on a daily double, per the standard rule. */
export function maxWager(state: JeopardyState, pack: JeopardyPack, playerId: string): number {
  const round = pack.rounds[state.roundIndex]
  const highestOnBoard = round ? Math.max(...round.values) : 0
  return Math.max(score(state, playerId), highestOnBoard)
}

/**
 * In Final Jeopardy a player may wager up to their own score, and a player who
 * is not in front cannot wager at all. Nothing on the board matters here, which
 * is what separates this from `maxWager`.
 */
export function maxFinalWager(state: JeopardyState, playerId: string): number {
  return Math.max(0, score(state, playerId))
}

/**
 * A phone may only buzz itself in, and may only wager while it is the one on
 * the hook for a daily double — or during Final Jeopardy, where everyone
 * wagers at once. The caller's id always wins over the payload's.
 */
export function authorizeJeopardyPlayerAction(
  raw: unknown,
  playerId: string,
  state: JeopardyState,
): JeopardyAction | null {
  const parsed = jeopardyPlayerActionSchema.safeParse(raw)
  if (!parsed.success) return null

  switch (parsed.data.type) {
    case 'buzz':
      return { type: 'buzz', playerId }
    case 'select_clue':
      // Only the player holding the board picks from it, and only while it is
      // up. This decides who; the reducer still decides what, so a stale phone
      // tapping a clue somebody else just took changes nothing.
      if (state.phase !== 'board' || state.controlPlayerId !== playerId) return null
      return {
        type: 'select_clue',
        categoryIndex: parsed.data.categoryIndex,
        clueIndex: parsed.data.clueIndex,
      }
    case 'set_wager':
      // Everyone wagers in the final; only the player on the hook wagers on a
      // daily double. The reducer clamps the amount either way.
      if (state.phase === 'final_wager') {
        return { type: 'set_wager', playerId, amount: parsed.data.amount }
      }
      if (state.phase !== 'daily_double' || state.buzzedPlayerId !== playerId) return null
      return { type: 'set_wager', playerId, amount: parsed.data.amount }
    case 'lock_wager':
      if (state.phase !== 'daily_double' || state.buzzedPlayerId !== playerId) return null
      return { type: 'lock_wager' }
  }
}

/**
 * The lines this game reads, built once and used two ways: `narrateJeopardy`
 * picks the one that matches the current state, and `jeopardyNarrationLines`
 * enumerates all of them so a pack can be rendered to audio ahead of time.
 *
 * They share these builders on purpose. The pre-render cache is keyed on the
 * text itself, so if the two ever produced different wording the cache would
 * fill with lines nobody ever asks for and the room would hear none of it.
 */
const DAILY_DOUBLE_LINE = 'Daily Double! Place your wager.'

function clueNarration(
  pack: JeopardyPack,
  roundIndex: number,
  categoryIndex: number,
  clueIndex: number,
): NarrationLine | null {
  const round = pack.rounds[roundIndex]
  const category = round?.categories[categoryIndex]
  const clue = category?.clues[clueIndex]
  if (!round || !category || !clue) return null

  // A Daily Double's clue is read without its value: the wager is the value.
  const preamble = clue.dailyDouble
    ? ''
    : `${category.name}, for ${formatScore(clueValue(round, clueIndex))}. `
  return {
    id: `clue:${clueKey(roundIndex, categoryIndex, clueIndex)}`,
    text: `${preamble}${clue.clue}`,
    kind: 'clue',
  }
}

function answerNarration(
  pack: JeopardyPack,
  roundIndex: number,
  categoryIndex: number,
  clueIndex: number,
): NarrationLine | null {
  const clue = pack.rounds[roundIndex]?.categories[categoryIndex]?.clues[clueIndex]
  if (!clue) return null
  return {
    id: `answer:${clueKey(roundIndex, categoryIndex, clueIndex)}`,
    text: clue.answer,
    kind: 'flavour',
  }
}

function finalWagerNarration(pack: JeopardyPack): NarrationLine {
  return {
    id: 'final:wager',
    text: `Final Jeopardy. The category is ${pack.final.category}. Place your wagers.`,
    kind: 'flavour',
  }
}

/**
 * What the big screen should be reading.
 *
 * The ids are keyed on the clue rather than on the phase so that somebody
 * buzzing in mid-sentence does not restart the sentence. During the wager the
 * clue is deliberately not read: it is not on screen yet.
 */
export function narrateJeopardy(
  pack: JeopardyPack,
  state: JeopardyState,
  _ctx: MatchContext,
): NarrationLine | null {
  const current = state.current

  if (state.phase === 'daily_double' && current) {
    return {
      id: `dd:${clueKey(state.roundIndex, current.categoryIndex, current.clueIndex)}`,
      text: DAILY_DOUBLE_LINE,
      kind: 'flavour',
    }
  }

  if (current && (state.phase === 'clue' || state.phase === 'buzzed')) {
    return clueNarration(pack, state.roundIndex, current.categoryIndex, current.clueIndex)
  }

  if (current && state.phase === 'revealed') {
    return answerNarration(pack, state.roundIndex, current.categoryIndex, current.clueIndex)
  }

  if (state.phase === 'final_wager') return finalWagerNarration(pack)
  if (state.phase === 'final_clue') {
    return { id: 'final:clue', text: pack.final.clue, kind: 'clue' }
  }
  if (state.phase === 'final_reveal') {
    return { id: 'final:answer', text: pack.final.answer, kind: 'flavour' }
  }

  return null
}

/** Every line this pack can ever produce, for rendering to audio up front. */
export function jeopardyNarrationLines(pack: JeopardyPack): NarrationLine[] {
  const lines: NarrationLine[] = [{ id: 'dd', text: DAILY_DOUBLE_LINE, kind: 'flavour' }]

  pack.rounds.forEach((round, roundIndex) => {
    round.categories.forEach((category, categoryIndex) => {
      category.clues.forEach((_clue, clueIndex) => {
        const clue = clueNarration(pack, roundIndex, categoryIndex, clueIndex)
        const answer = answerNarration(pack, roundIndex, categoryIndex, clueIndex)
        if (clue) lines.push(clue)
        if (answer) lines.push(answer)
      })
    })
  })

  lines.push(finalWagerNarration(pack))
  lines.push({ id: 'final:clue', text: pack.final.clue, kind: 'clue' })
  lines.push({ id: 'final:answer', text: pack.final.answer, kind: 'flavour' })
  return lines
}

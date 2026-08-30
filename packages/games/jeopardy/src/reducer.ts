import type { MatchContext } from '@workspace/common/game'
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
    lockedOut: [],
    wagers: {},
    scores: Object.fromEntries(ctx.players.map((player) => [player.id, 0])),
    controlPlayerId: ctx.players[0]?.id ?? null,
  }
}

function score(state: JeopardyState, playerId: string): number {
  return state.scores[playerId] ?? 0
}

/** The wagered amount on a daily double, falling back to the clue's face value. */
function stake(state: JeopardyState): number {
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

      // Only the player in control plays a daily double, so it opens already
      // buzzed in: there is nobody else for the host to wait on.
      const soloDailyDouble = clue.dailyDouble && state.controlPlayerId !== null

      return {
        ...state,
        phase: soloDailyDouble ? 'buzzed' : 'clue',
        current: {
          categoryIndex: action.categoryIndex,
          clueIndex: action.clueIndex,
          value: clueValue(round, action.clueIndex),
          dailyDouble: clue.dailyDouble,
        },
        buzzedPlayerId: soloDailyDouble ? state.controlPlayerId : null,
        lockedOut: [],
      }
    }

    case 'buzz': {
      if (state.phase !== 'clue') return state
      if (state.buzzedPlayerId) return state
      if (state.lockedOut.includes(action.playerId)) return state
      if (!ctx.players.some((player) => player.id === action.playerId)) return state
      return { ...state, phase: 'buzzed', buzzedPlayerId: action.playerId }
    }

    case 'clear_buzz': {
      if (state.phase !== 'buzzed') return state
      return { ...state, phase: 'clue', buzzedPlayerId: null }
    }

    case 'judge': {
      const playerId = state.buzzedPlayerId
      if (!playerId || !state.current) return state
      const amount = stake(state)

      if (action.correct) {
        return {
          ...state,
          phase: 'revealed',
          scores: { ...state.scores, [playerId]: score(state, playerId) + amount },
          controlPlayerId: playerId,
          buzzedPlayerId: null,
        }
      }

      const lockedOut = [...state.lockedOut, playerId]
      const everyoneLockedOut = lockedOut.length >= ctx.players.length
      return {
        ...state,
        // A missed daily double belongs to one player only, so it ends immediately.
        phase: state.current.dailyDouble || everyoneLockedOut ? 'revealed' : 'clue',
        scores: { ...state.scores, [playerId]: score(state, playerId) - amount },
        buzzedPlayerId: null,
        lockedOut,
      }
    }

    case 'reveal_answer':
      return state.phase === 'clue' || state.phase === 'buzzed'
        ? { ...state, phase: 'revealed', buzzedPlayerId: null }
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
        lockedOut: [],
      }
    }

    case 'set_wager':
      return { ...state, wagers: { ...state.wagers, [action.playerId]: action.amount } }

    case 'set_control':
      return { ...state, controlPlayerId: action.playerId }

    case 'adjust_score':
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.playerId]: score(state, action.playerId) + action.delta,
        },
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
        lockedOut: [],
      }
    }

    case 'start_final':
      return { ...state, phase: 'final_wager', current: null, buzzedPlayerId: null, lockedOut: [] }

    case 'reveal_final':
      if (state.phase === 'final_wager') return { ...state, phase: 'final_clue' }
      if (state.phase === 'final_clue') return { ...state, phase: 'final_reveal' }
      return state

    case 'finish':
      return { ...state, phase: 'finished' }
  }
}

/** Highest wager a player may place on a daily double, per the standard rule. */
export function maxWager(state: JeopardyState, pack: JeopardyPack, playerId: string): number {
  const round = pack.rounds[state.roundIndex]
  const highestOnBoard = round ? Math.max(...round.values) : 0
  return Math.max(score(state, playerId), highestOnBoard)
}

/**
 * A phone may only buzz itself in, and may only wager while it is the one on
 * the hook for a daily double. The caller's id always wins over the payload's.
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
    case 'set_wager':
      // Only the player actually on the hook may set the wager.
      if (state.buzzedPlayerId !== playerId) return null
      return { type: 'set_wager', playerId, amount: parsed.data.amount }
  }
}

import type { MatchContext } from '@workspace/common/game'
import { type FeudAction, feudPlayerActionSchema } from './actions'
import { type FeudPack, type FeudRound, MAX_STRIKES } from './content'
import type { FeudState } from './state'

export function createFeudState(_pack: FeudPack, ctx: MatchContext): FeudState {
  return {
    phase: 'face_off',
    roundIndex: 0,
    revealed: [],
    strikes: 0,
    pot: 0,
    controlTeamId: null,
    stealingTeamId: null,
    buzzedPlayerId: null,
    scores: Object.fromEntries(ctx.teams.map((team) => [team.id, 0])),
  }
}

function allRevealed(round: FeudRound, revealed: number[]): boolean {
  return revealed.length >= round.answers.length
}

/**
 * Moves a pot into a team's score, applying the round multiplier. With no team
 * to pay, the pot stays on the board for the host to assign by hand.
 */
function award(
  state: FeudState,
  round: FeudRound,
  teamId: string | null,
  pot: number,
): Pick<FeudState, 'pot' | 'scores'> {
  if (!teamId) return { pot, scores: state.scores }
  return {
    pot: 0,
    scores: { ...state.scores, [teamId]: (state.scores[teamId] ?? 0) + pot * round.multiplier },
  }
}

export function reduceFeud(
  pack: FeudPack,
  state: FeudState,
  action: FeudAction,
  ctx: MatchContext,
): FeudState {
  const round = pack.rounds[state.roundIndex]

  switch (action.type) {
    case 'reveal': {
      if (!round || state.phase === 'finished') return state
      const answer = round.answers[action.answerIndex]
      if (!answer || state.revealed.includes(action.answerIndex)) return state

      // Once the round is settled the host still turns the rest of the board
      // over for the audience: show the answer, but the scoring is done.
      if (state.phase === 'round_over') {
        return { ...state, revealed: [...state.revealed, action.answerIndex] }
      }

      const revealed = [...state.revealed, action.answerIndex]
      const pot = state.pot + answer.points

      // A successful steal ends the round on the first correct answer and takes
      // the whole pot from the team that built it.
      if (state.phase === 'steal' && state.stealingTeamId) {
        return {
          ...state,
          phase: 'round_over',
          revealed,
          ...award(state, round, state.stealingTeamId, pot),
          controlTeamId: state.stealingTeamId,
        }
      }

      // Sweeping the board wins the round outright.
      if (allRevealed(round, revealed)) {
        return {
          ...state,
          phase: 'round_over',
          revealed,
          ...award(state, round, state.controlTeamId, pot),
        }
      }

      return { ...state, revealed, pot }
    }

    case 'strike': {
      const strikes = Math.min(state.strikes + 1, MAX_STRIKES)
      if (state.phase === 'steal' && round) {
        // A failed steal hands the pot back to the team that built it.
        return {
          ...state,
          phase: 'round_over',
          strikes,
          stealingTeamId: null,
          ...award(state, round, state.controlTeamId, state.pot),
        }
      }
      return { ...state, strikes }
    }

    case 'clear_strikes':
      return { ...state, strikes: 0 }

    case 'face_off_buzz': {
      // First phone in wins the face-off; later presses are ignored.
      if (state.phase !== 'face_off' || state.buzzedPlayerId) return state
      if (!ctx.players.some((player) => player.id === action.playerId)) return state
      return { ...state, buzzedPlayerId: action.playerId }
    }

    case 'clear_buzz':
      return state.buzzedPlayerId ? { ...state, buzzedPlayerId: null } : state

    case 'set_control':
      return {
        ...state,
        phase: state.phase === 'face_off' && action.teamId ? 'play' : state.phase,
        controlTeamId: action.teamId,
        buzzedPlayerId: null,
      }

    case 'start_steal': {
      if (!ctx.teams.some((team) => team.id === action.teamId)) return state
      return { ...state, phase: 'steal', stealingTeamId: action.teamId, strikes: MAX_STRIKES }
    }

    case 'award_pot': {
      if (!round) return state
      if (!ctx.teams.some((team) => team.id === action.teamId)) return state
      const awarded = state.pot * round.multiplier
      return {
        ...state,
        phase: 'round_over',
        scores: {
          ...state.scores,
          [action.teamId]: (state.scores[action.teamId] ?? 0) + awarded,
        },
        pot: 0,
      }
    }

    case 'adjust_score':
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.teamId]: (state.scores[action.teamId] ?? 0) + action.delta,
        },
      }

    case 'next_round': {
      const nextIndex = state.roundIndex + 1
      if (nextIndex >= pack.rounds.length) return { ...state, phase: 'finished' }
      return {
        ...state,
        phase: 'face_off',
        roundIndex: nextIndex,
        revealed: [],
        strikes: 0,
        pot: 0,
        controlTeamId: null,
        stealingTeamId: null,
        buzzedPlayerId: null,
      }
    }

    case 'finish':
      return { ...state, phase: 'finished' }
  }
}

/** From a phone, the only Feud move is hitting the face-off buzzer. */
export function authorizeFeudPlayerAction(raw: unknown, playerId: string): FeudAction | null {
  if (!feudPlayerActionSchema.safeParse(raw).success) return null
  return { type: 'face_off_buzz', playerId }
}

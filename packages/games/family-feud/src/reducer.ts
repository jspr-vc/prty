import type { MatchContext, NarrationLine } from '@workspace/common/game'
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
    buzzerArmed: true,
    faceOffMisses: 0,
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

    case 'hide': {
      // Turning an answer back over, for when the wrong one got tapped.
      if (!round || state.phase === 'finished') return state
      if (!state.revealed.includes(action.answerIndex)) return state
      const answer = round.answers[action.answerIndex]
      if (!answer) return state

      // Revealing during `round_over` is showing the rest of the board to the
      // audience and banks nothing, so hiding it must not take anything back.
      // Anywhere else, the points went into the pot and have to come out again.
      //
      // If the reveal *settled* the round, the pot has already been paid into a
      // score and is gone from here — hiding will not un-pay it, and the host's
      // score box is the honest way to correct that.
      const pot = state.phase === 'round_over' ? state.pot : Math.max(0, state.pot - answer.points)

      return {
        ...state,
        revealed: state.revealed.filter((index) => index !== action.answerIndex),
        pot,
      }
    }

    case 'strike': {
      // An X in the face-off is not a strike. Nobody holds the board yet, so
      // there is nothing to strike out on: it means "not up there", the other
      // contestant answers next, and the three strikes stay unspent for the
      // team that eventually wins control.
      //
      // The room is left disarmed on purpose. The second answer in a face-off
      // is given by turn rather than raced for, and re-arming here would let
      // the contestant who just missed slam their pad again and take it. The
      // host's arm toggle and the reset pad both put the race back on.
      if (state.phase === 'face_off') {
        return {
          ...state,
          faceOffMisses: state.faceOffMisses + 1,
          buzzedPlayerId: null,
          buzzerArmed: false,
        }
      }

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
      // The latch decides, not `buzzedPlayerId`. Two pads pressed together both
      // reach a reducer running on one serialised queue, and the second finds
      // the room disarmed — which is what makes the face-off unstealable.
      if (state.phase !== 'face_off' || !state.buzzerArmed || state.buzzedPlayerId) return state
      if (!ctx.players.some((player) => player.id === action.playerId)) return state
      return { ...state, buzzedPlayerId: action.playerId, buzzerArmed: false }
    }

    case 'clear_buzz': {
      // The reset pad: clears whoever is in and re-arms the face-off. In the
      // face-off it starts the whole thing over, X's included — that is what a
      // fresh pair stepping up means, and it is the way back from a face-off
      // nobody won.
      const armed = state.phase === 'face_off'
      const misses = armed ? 0 : state.faceOffMisses
      if (!state.buzzedPlayerId && state.buzzerArmed === armed && state.faceOffMisses === misses) {
        return state
      }
      return { ...state, buzzedPlayerId: null, buzzerArmed: armed, faceOffMisses: misses }
    }

    case 'set_buzzers_armed': {
      if (state.phase !== 'face_off') return state
      if (state.buzzerArmed === action.armed) return state
      return { ...state, buzzerArmed: action.armed }
    }

    case 'set_control':
      return {
        ...state,
        phase: state.phase === 'face_off' && action.teamId ? 'play' : state.phase,
        controlTeamId: action.teamId,
        buzzedPlayerId: null,
        // The face-off is settled; nothing left to race for this round.
        buzzerArmed: false,
        faceOffMisses: 0,
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

    case 'adjust_score': {
      if (action.delta === 0) return state
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.teamId]: (state.scores[action.teamId] ?? 0) + action.delta,
        },
      }
    }

    case 'set_score': {
      if (!ctx.teams.some((team) => team.id === action.teamId)) return state
      // Rejecting a no-op keeps a host who retypes the number they already had
      // from writing an event and waking the room.
      if ((state.scores[action.teamId] ?? 0) === action.value) return state
      return { ...state, scores: { ...state.scores, [action.teamId]: action.value } }
    }

    case 'next_round': {
      const nextIndex = state.roundIndex + 1
      if (nextIndex >= pack.rounds.length)
        return { ...state, phase: 'finished', buzzerArmed: false }
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
        // A new round is a new face-off: the room is live again.
        buzzerArmed: true,
        faceOffMisses: 0,
      }
    }

    case 'finish':
      return { ...state, phase: 'finished', buzzerArmed: false }
  }
}

/** From a phone, the only Feud move is hitting the face-off buzzer. */
export function authorizeFeudPlayerAction(raw: unknown, playerId: string): FeudAction | null {
  if (!feudPlayerActionSchema.safeParse(raw).success) return null
  return { type: 'face_off_buzz', playerId }
}

/** Shared by the live narrator and the pre-render, so their wording cannot drift. */
function questionNarration(round: FeudRound, roundIndex: number): NarrationLine {
  return { id: `question:${roundIndex}`, text: round.question, kind: 'clue' }
}

function answerNarration(
  round: FeudRound,
  roundIndex: number,
  answerIndex: number,
): NarrationLine | null {
  const answer = round.answers[answerIndex]
  if (!answer) return null
  // The answer only. The board is already showing the points beside it, and
  // read aloud they land as a bare number after the phrase — "Who is paying.
  // Twenty four." — which sounds like part of the answer rather than its score.
  return {
    id: `answer:${roundIndex}:${answerIndex}`,
    text: answer.text,
    kind: 'flavour',
  }
}

/**
 * The board reads its own question, then each answer as it is turned over.
 *
 * Answers are `flavour` rather than `clue`: a host who only wants the question
 * read out gets exactly that, and the room still has the fun of the reveal.
 */
export function narrateFeud(
  pack: FeudPack,
  state: FeudState,
  _ctx: MatchContext,
): NarrationLine | null {
  const round = pack.rounds[state.roundIndex]
  if (!round || state.phase === 'finished') return null

  const lastIndex = state.revealed[state.revealed.length - 1]
  if (lastIndex !== undefined) {
    const answer = answerNarration(round, state.roundIndex, lastIndex)
    if (answer) return answer
  }

  return questionNarration(round, state.roundIndex)
}

/** Every line this pack can ever produce, for rendering to audio up front. */
export function feudNarrationLines(pack: FeudPack): NarrationLine[] {
  const lines: NarrationLine[] = []
  pack.rounds.forEach((round, roundIndex) => {
    lines.push(questionNarration(round, roundIndex))
    round.answers.forEach((_answer, answerIndex) => {
      const line = answerNarration(round, roundIndex, answerIndex)
      if (line) lines.push(line)
    })
  })
  return lines
}

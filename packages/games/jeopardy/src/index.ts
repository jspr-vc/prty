import type { GameDefinition } from '@workspace/common/game'
import type { JeopardyAction } from './actions'
import { jeopardyActionSchema } from './actions'
import { type JeopardyPack, jeopardyPackSchema } from './content'
import {
  authorizeJeopardyPlayerAction,
  createJeopardyState,
  jeopardyNarrationLines,
  narrateJeopardy,
  reduceJeopardy,
} from './reducer'
import { type JeopardyState, jeopardyStateSchema } from './state'

export const jeopardy: GameDefinition<JeopardyPack, JeopardyState, JeopardyAction> = {
  slug: 'jeopardy',
  name: 'Jeopardy',
  description: 'Categories, clues and buzzers. Answer in the form of a question.',
  minPlayers: 2,
  maxPlayers: 6,
  packSchema: jeopardyPackSchema,
  stateSchema: jeopardyStateSchema,
  actionSchema: jeopardyActionSchema,
  createState: createJeopardyState,
  reduce: reduceJeopardy,
  authorizePlayerAction: (raw, playerId, state) =>
    authorizeJeopardyPlayerAction(raw, playerId, state),
  narrate: narrateJeopardy,
  narrationLines: jeopardyNarrationLines,
  buzzerAction: (playerId) => ({ type: 'buzz', playerId }),
  buzzerResetAction: () => ({ type: 'clear_buzz' }),
}

export * from './actions'
export * from './content'
export * from './reducer'
export * from './state'

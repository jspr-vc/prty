import type { GameDefinition } from '@workspace/common/game'
import type { FeudAction } from './actions'
import { feudActionSchema } from './actions'
import { type FeudPack, feudPackSchema } from './content'
import {
  authorizeFeudPlayerAction,
  createFeudState,
  feudNarrationLines,
  narrateFeud,
  reduceFeud,
} from './reducer'
import { type FeudState, feudStateSchema } from './state'

export const familyFeud: GameDefinition<FeudPack, FeudState, FeudAction> = {
  slug: 'family-feud',
  name: 'Family Feud',
  description: 'Two teams guess the most popular survey answers. Three strikes and it is a steal.',
  minPlayers: 2,
  maxPlayers: 12,
  packSchema: feudPackSchema,
  stateSchema: feudStateSchema,
  actionSchema: feudActionSchema,
  createState: createFeudState,
  reduce: reduceFeud,
  authorizePlayerAction: (raw, playerId) => authorizeFeudPlayerAction(raw, playerId),
  narrate: narrateFeud,
  narrationLines: feudNarrationLines,
  buzzerAction: (playerId) => ({ type: 'face_off_buzz', playerId }),
  buzzerResetAction: () => ({ type: 'clear_buzz' }),
}

export * from './actions'
export * from './content'
export * from './reducer'
export * from './state'

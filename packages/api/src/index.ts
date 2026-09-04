export { TRPC_ENDPOINT } from './config'
export { createTRPCContext, isHostPin, type TRPCContext } from './context'
export {
  type BuzzerOutcome,
  dispatchHostAction,
  dispatchPlayerAction,
  type MatchUpdate,
  pressBuzzer,
} from './match-service'
export { type AppRouter, appRouter, createCaller } from './root'
export type { RouterInputs, RouterOutputs } from './types'

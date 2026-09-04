import { buzzerRouter } from './routers/buzzer'
import { gameRouter } from './routers/game'
import { hostRouter } from './routers/host'
import { matchRouter } from './routers/match'
import { sessionRouter } from './routers/session'
import { createCallerFactory, createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  host: hostRouter,
  game: gameRouter,
  session: sessionRouter,
  match: matchRouter,
  buzzer: buzzerRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)

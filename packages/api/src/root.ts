import { gameRouter } from './routers/game'
import { matchRouter } from './routers/match'
import { sessionRouter } from './routers/session'
import { createCallerFactory, createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  game: gameRouter,
  session: sessionRouter,
  match: matchRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)

import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'
import type { TRPCContext } from './context'

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? z.treeifyError(error.cause) : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

export const publicProcedure = t.procedure

/** Everything that drives the show. Guarded by the PIN the binary printed. */
export const hostProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isHost) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Host PIN required' })
  }
  return next({ ctx })
})

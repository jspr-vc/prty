import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { TRPC_ENDPOINT } from './config'
import { createTRPCContext } from './context'
import { appRouter } from './root'

export function trpcHandler(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError({ error, path }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(`tRPC error on ${path ?? '<no-path>'}:`, error)
      }
    },
  })
}

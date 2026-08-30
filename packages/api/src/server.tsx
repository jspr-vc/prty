import 'server-only'

import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { headers } from 'next/headers'
import { cache } from 'react'
import { createTRPCContext } from './context'
import { createQueryClient } from './query-client'
import { appRouter, createCaller } from './root'

export const getQueryClient = cache(createQueryClient)

const createContext = cache(async () => createTRPCContext({ headers: await headers() }))

export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
})

export const api = createCaller(createContext)

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>
}

/**
 * Awaited on purpose: a fire-and-forget prefetch dehydrates a still-pending
 * query, so the server renders a loading state while the client renders real
 * data on its first pass, and React reports a hydration mismatch.
 */
// biome-ignore lint/suspicious/noExplicitAny: accepts any tRPC query options object
export async function prefetch(queryOptions: any): Promise<void> {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    await queryClient.prefetchInfiniteQuery(queryOptions)
  } else {
    await queryClient.prefetchQuery(queryOptions)
  }
}

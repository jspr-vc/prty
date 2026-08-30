'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import superjson from 'superjson'
import { TRPC_ENDPOINT } from './config'
import { createQueryClient } from './query-client'
import type { AppRouter } from './root'

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()

let browserQueryClient: ReturnType<typeof createQueryClient> | undefined

function getQueryClient() {
  if (typeof window === 'undefined') return createQueryClient()
  browserQueryClient ??= createQueryClient()
  return browserQueryClient
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchStreamLink({
          url: `${getBaseUrl()}${TRPC_ENDPOINT}`,
          transformer: superjson,
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}

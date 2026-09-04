'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { HOST_PIN_HEADER, HOST_PIN_STORAGE_KEY } from '@workspace/common/consts'
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

export function readHostPin(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(HOST_PIN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeHostPin(pin: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (pin) window.localStorage.setItem(HOST_PIN_STORAGE_KEY, pin)
    else window.localStorage.removeItem(HOST_PIN_STORAGE_KEY)
  } catch {
    // A browser with storage disabled can still watch; it just cannot host.
  }
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchStreamLink({
          url: TRPC_ENDPOINT,
          transformer: superjson,
          // Read per request, not once at construction: the console pairs after
          // the provider is already mounted, and should not need a reload.
          headers() {
            const pin = readHostPin()
            return pin ? { [HOST_PIN_HEADER]: pin } : {}
          },
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

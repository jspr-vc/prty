'use client'

import { TRPCReactProvider } from '@workspace/api/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>
}

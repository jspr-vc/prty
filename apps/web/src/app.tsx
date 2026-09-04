import { RouterProvider } from '@tanstack/react-router'
import { TRPCReactProvider } from '@workspace/api/react'
import { router } from './router'

export function App() {
  return (
    <TRPCReactProvider>
      <RouterProvider router={router} />
    </TRPCReactProvider>
  )
}

import { APP_NAME } from '@workspace/common/consts'
import type { Metadata } from 'next'
import '@workspace/ui/globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: `${APP_NAME} · Gamemaster`,
  description: 'Host controls for gameshow night.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-svh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

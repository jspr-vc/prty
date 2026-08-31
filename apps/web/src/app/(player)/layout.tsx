import { APP_NAME } from '@workspace/common/consts'
import type { Metadata, Viewport } from 'next'
import '@workspace/ui/globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: `${APP_NAME} · Join`,
  description: 'Register and buzz in from your phone.',
}

export const viewport: Viewport = {
  themeColor: '#0a0b0f',
  // The buzzer is a target you hit fast; a double-tap zoom would ruin it.
  maximumScale: 1,
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-svh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

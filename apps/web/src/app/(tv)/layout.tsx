import { APP_NAME } from '@workspace/common/consts'
import type { Metadata, Viewport } from 'next'
import '@workspace/ui/globals.css'
import { Providers } from '@/components/providers'
import { SoundUnlock } from '@/components/sound-unlock'

export const metadata: Metadata = {
  title: `${APP_NAME} · Big screen`,
  description: 'The display everyone watches.',
}

export const viewport: Viewport = {
  themeColor: '#0a0b0f',
}

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh overflow-hidden antialiased">
        <Providers>{children}</Providers>
        <SoundUnlock />
      </body>
    </html>
  )
}

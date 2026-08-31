import { HydrateClient, prefetch, trpc } from '@workspace/api/server'
import { headers } from 'next/headers'
import { TvScreen } from '@/components/tv-screen'

/**
 * The QR code points back at this same host. Building it from the request rather
 * than from `window.location` keeps the server and client markup identical — the
 * two disagreed otherwise, and React reported a hydration mismatch — and rather
 * than from an environment variable, so changing the domain needs no rebuild.
 */
async function origin() {
  const head = await headers()
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? 'localhost:3000'
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export default async function SessionScreen({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const normalized = code.toUpperCase()

  await prefetch(trpc.session.byCode.queryOptions(normalized))

  return (
    <HydrateClient>
      <TvScreen code={normalized} joinOrigin={await origin()} />
    </HydrateClient>
  )
}

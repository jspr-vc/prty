import { HydrateClient, prefetch, trpc } from '@workspace/api/server'
import { auth } from '@workspace/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SessionConsole } from '@/components/session-console'

export default async function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/sign-in')

  const { code } = await params
  const normalized = code.toUpperCase()

  await prefetch(trpc.session.byCode.queryOptions(normalized))
  await prefetch(trpc.game.list.queryOptions())

  return (
    <HydrateClient>
      <SessionConsole code={normalized} tvUrl={process.env.TV_URL ?? ''} />
    </HydrateClient>
  )
}

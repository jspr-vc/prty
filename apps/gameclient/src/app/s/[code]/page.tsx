import { HydrateClient, prefetch, trpc } from '@workspace/api/server'
import { TvScreen } from '@/components/tv-screen'

export default async function SessionScreen({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const normalized = code.toUpperCase()

  await prefetch(trpc.session.byCode.queryOptions(normalized))

  return (
    <HydrateClient>
      <TvScreen code={normalized} />
    </HydrateClient>
  )
}

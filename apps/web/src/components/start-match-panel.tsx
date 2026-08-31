'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import type { GameSlug } from '@workspace/common/consts'
import { Button } from '@workspace/ui/components/ui/button'
import { useState } from 'react'

type Session = NonNullable<RouterOutputs['session']['byCode']>

export function StartMatchPanel({
  session,
  onStarted,
}: {
  session: Session
  onStarted: () => void
}) {
  const trpc = useTRPC()
  const [slug, setSlug] = useState<GameSlug>('jeopardy')

  const games = useQuery(trpc.game.list.queryOptions())
  const packs = useQuery(trpc.game.packs.queryOptions(slug))
  const create = useMutation(trpc.match.create.mutationOptions({ onSuccess: onStarted }))

  return (
    <section className="space-y-3">
      <h2 className="font-medium text-sm uppercase tracking-wide">Start a game</h2>

      <div className="flex flex-wrap gap-2">
        {games.data?.map((game) => (
          <Button
            key={game.id}
            size="sm"
            variant={game.slug === slug ? 'default' : 'outline'}
            onClick={() => setSlug(game.slug as GameSlug)}
          >
            {game.name}
          </Button>
        ))}
      </div>

      {packs.data?.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No question packs for this game. Run <code>bun run db:seed</code>.
        </p>
      )}

      <div className="space-y-2">
        {packs.data?.map((pack) => (
          <Button
            key={pack.id}
            variant="secondary"
            className="w-full justify-start"
            disabled={create.isPending}
            onClick={() =>
              create.mutate({ sessionId: session.id, gameSlug: slug, packId: pack.id })
            }
          >
            {pack.name}
          </Button>
        ))}
      </div>

      {create.error && <p className="text-destructive text-sm">{create.error.message}</p>}
    </section>
  )
}

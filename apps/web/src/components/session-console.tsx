'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@workspace/api/react'
import { useSessionChannel } from '@workspace/realtime/client'
import { Button } from '@workspace/ui/components/ui/button'
import { useCallback } from 'react'
import { LobbyPanel } from '@/components/lobby-panel'
import { StartMatchPanel } from '@/components/start-match-panel'
import { GameControl } from '@/games/registry'

export function SessionConsole({ code }: { code: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const sessionQuery = useQuery(trpc.session.byCode.queryOptions(code))
  const session = sessionQuery.data

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: trpc.session.byCode.queryKey(code) })
  }, [queryClient, trpc, code])

  const connection = useSessionChannel(session?.id, invalidate)

  const dispatch = useMutation(trpc.match.dispatch.mutationOptions({ onSuccess: invalidate }))
  const endMatch = useMutation(trpc.match.end.mutationOptions({ onSuccess: invalidate }))

  if (sessionQuery.isPending) {
    return (
      <Shell code={code}>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </Shell>
    )
  }
  if (!session) {
    return (
      <Shell code={code}>
        <p className="text-destructive text-sm">No session with that code.</p>
      </Shell>
    )
  }

  const match = session.activeMatch
  const ctx = {
    players: session.players.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      teamId: player.teamId,
    })),
    teams: session.teams.map((team) => ({ id: team.id, name: team.name, color: team.color })),
  }

  return (
    <Shell code={code} name={session.name} connection={connection}>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-8">
          <LobbyPanel session={session} onChanged={invalidate} />
          {!match && <StartMatchPanel session={session} onStarted={invalidate} />}
        </div>

        <div className="space-y-4">
          {match ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-medium text-sm uppercase tracking-wide">{match.game.name}</h2>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={endMatch.isPending}
                  onClick={() => endMatch.mutate({ matchId: match.id })}
                >
                  End match
                </Button>
              </div>
              <GameControl
                slug={match.game.slug}
                pack={match.pack?.content}
                state={match.state}
                ctx={ctx}
                pending={dispatch.isPending}
                onAction={(action) => dispatch.mutate({ matchId: match.id, action })}
              />
              {dispatch.error && (
                <p className="text-destructive text-sm">{dispatch.error.message}</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No match running. Pick a game once everyone has joined.
            </p>
          )}
        </div>
      </div>
    </Shell>
  )
}

function Shell({
  code,
  name,
  connection,
  children,
}: {
  code: string
  name?: string
  connection?: 'connecting' | 'connected' | 'error'
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{name ?? 'Session'}</h1>
          <p className="text-muted-foreground text-sm">
            Code <span className="font-mono tracking-[0.3em]">{code}</span>
            {connection && ` · realtime ${connection}`}
          </p>
        </div>
        <a
          href={`/s/${code}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline underline-offset-4"
        >
          Open TV view
        </a>
      </header>
      {children}
    </main>
  )
}

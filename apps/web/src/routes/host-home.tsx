import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import { APP_NAME } from '@workspace/common/consts'
import { Button } from '@workspace/ui/components/ui/button'
import { useEffect, useState } from 'react'
import { CreateSessionForm } from '@/components/create-session-form'
import { HostGate } from '@/components/host-gate'
import { useSurface } from '@/components/surface'

type Night = RouterOutputs['session']['list'][number]

export function HostHome() {
  useSurface('console')

  return (
    <HostGate>
      <Nights />
    </HostGate>
  )
}

function Nights() {
  const trpc = useTRPC()
  const sessions = useQuery(trpc.session.list.queryOptions())

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="space-y-1">
        <h1 className="font-semibold text-3xl tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground text-sm">Hosting from this machine.</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-medium text-sm uppercase tracking-wide">New night</h2>
        <CreateSessionForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-sm uppercase tracking-wide">Your nights</h2>
        {sessions.data?.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing yet. Start one above.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {sessions.data?.map((entry) => (
              <li key={entry.id} className="flex items-center gap-1 pr-2">
                <Link
                  to="/host/$code"
                  params={{ code: entry.code }}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 p-4 hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{entry.name}</span>
                    <span className="block text-muted-foreground text-xs">
                      {entry.players.length} player{entry.players.length === 1 ? '' : 's'} ·{' '}
                      {entry.status}
                    </span>
                  </span>
                  <span className="font-mono text-lg tracking-[0.3em]">{entry.code}</span>
                </Link>
                <DeleteNight night={entry} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

/**
 * Two clicks to delete, rather than a modal.
 *
 * Deleting a night takes its players, teams, buzzer bindings, matches and event
 * log with it, so it wants a deliberate second press — but a blocking `confirm()`
 * on a console being driven at speed is worse than the accident it prevents.
 * The armed state disarms itself, so a stray first click cannot leave a live
 * delete button sitting under the host's next one.
 */
function DeleteNight({ night }: { night: Night }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [armed, setArmed] = useState(false)

  const remove = useMutation(
    trpc.session.remove.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.session.list.queryKey() })
      },
    }),
  )

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])

  if (!armed) {
    return (
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Delete ${night.name}`}
        onClick={() => setArmed(true)}
      >
        Delete
      </Button>
    )
  }

  return (
    <span className="flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
        Cancel
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={remove.isPending}
        aria-label={`Confirm deleting ${night.name}`}
        onClick={() => remove.mutate({ sessionId: night.id })}
      >
        {night.players.length > 0 ? `Delete + ${night.players.length}` : 'Delete'}
      </Button>
    </span>
  )
}

import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTRPC } from '@workspace/api/react'
import { BUZZER_RESET_KEY } from '@workspace/common/consts'
import type { BuzzerTarget } from '@workspace/common/schemas'
import { Button } from '@workspace/ui/components/ui/button'
import { useState } from 'react'
import { BuzzerPanel } from '@/components/buzzer-panel'
import { LobbyPanel } from '@/components/lobby-panel'
import { NarrationPanel } from '@/components/narration-panel'
import { StartMatchPanel } from '@/components/start-match-panel'
import { GameControl } from '@/games/registry'
import { type BuzzerPad, useBuzzerKeys } from '@/hooks/use-buzzer-keys'
import { useSessionSync } from '@/hooks/use-session-sync'

export function SessionConsole({ code }: { code: string }) {
  const trpc = useTRPC()
  const sessionQuery = useQuery(trpc.session.byCode.queryOptions(code))
  const session = sessionQuery.data

  const { status: connection, applyMatch, invalidate, buzz } = useSessionSync(code, session?.id)

  /** Non-null while the host is pairing a pad, which changes what a press means. */
  const [capturing, setCapturing] = useState<BuzzerTarget | null>(null)

  // The console shows its own action the moment the server confirms it, from
  // the state the mutation already returned. Waiting for the broadcast to come
  // back round would make the host the last person in the room to see it.
  const dispatch = useMutation(
    trpc.match.dispatch.mutationOptions({
      onSuccess: (update) => {
        if (!applyMatch(update)) invalidate()
      },
    }),
  )
  const endMatch = useMutation(trpc.match.end.mutationOptions({ onSuccess: invalidate }))
  const bindPad = useMutation(trpc.buzzer.bind.mutationOptions({ onSuccess: invalidate }))
  const buzzOverHttp = useMutation(trpc.match.buzzer.mutationOptions())

  const press = (key: BuzzerPad) => {
    if (!session) return
    // The open socket is the fast path; HTTP is only for while it is down, so a
    // press is never delivered twice.
    if (connection === 'connected') buzz(key)
    else buzzOverHttp.mutate({ sessionId: session.id, key })
  }

  useBuzzerKeys((key) => {
    if (!session) return
    // Pairing swallows the press: this pad is being named, not fired.
    if (capturing && key !== BUZZER_RESET_KEY) {
      bindPad.mutate({ sessionId: session.id, key, target: capturing })
      setCapturing(null)
      return
    }
    press(key)
  }, Boolean(session))

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

  const buzzerArmed = (match?.state as { buzzerArmed?: boolean } | undefined)?.buzzerArmed

  return (
    <Shell code={code} name={session.name} connection={connection}>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-8">
          <LobbyPanel session={session} onChanged={invalidate} />
          <BuzzerPanel
            session={session}
            capturing={capturing}
            onCapturingChange={setCapturing}
            onReset={() => press(BUZZER_RESET_KEY)}
          />
          <NarrationPanel session={session} />
          {!match && <StartMatchPanel session={session} onStarted={invalidate} />}
        </div>

        <div className="space-y-4">
          {match ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-medium text-sm uppercase tracking-wide">
                  {match.game.name}
                  {buzzerArmed !== undefined && (
                    <span
                      className={
                        buzzerArmed
                          ? 'ml-3 rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-400 text-xs'
                          : 'ml-3 rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs'
                      }
                    >
                      {buzzerArmed ? 'buzzers live' : 'buzzers locked'}
                    </span>
                  )}
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => press(BUZZER_RESET_KEY)}>
                    Re-arm buzzers
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={endMatch.isPending}
                    onClick={() => endMatch.mutate({ matchId: match.id })}
                  >
                    End match
                  </Button>
                </div>
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
            {connection && ` · ${connection}`}
          </p>
        </div>
        <Link
          to="/s/$code"
          params={{ code }}
          target="_blank"
          className="text-sm underline underline-offset-4"
        >
          Open TV view
        </Link>
      </header>
      {children}
    </main>
  )
}

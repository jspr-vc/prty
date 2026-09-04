import { useMutation, useQuery } from '@tanstack/react-query'
import { useTRPC } from '@workspace/api/react'
import { PLAYER_TOKEN_STORAGE_KEY } from '@workspace/common/consts'
import { Button } from '@workspace/ui/components/ui/button'
import { useEffect, useState } from 'react'
import { PlayerConsole } from '@/components/player-console'
import { useSessionSync } from '@/hooks/use-session-sync'

function tokenKey(code: string) {
  return `${PLAYER_TOKEN_STORAGE_KEY}.${code}`
}

export function JoinForm({ code }: { code: string }) {
  const trpc = useTRPC()
  const [token, setToken] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [teamId, setTeamId] = useState('')

  // Read the stored token after mount so the server and client render the same markup.
  useEffect(() => {
    setToken(window.localStorage.getItem(tokenKey(code)))
  }, [code])

  const sessionQuery = useQuery(trpc.session.byCode.queryOptions(code))
  const meQuery = useQuery({
    ...trpc.session.me.queryOptions({ code, token: token ?? '' }),
    enabled: Boolean(token),
  })

  // A rename or a team change lands on `me`, which the session read does not
  // cover, so it is refetched whenever anything but a match update arrives.
  const { applyMatch, invalidate } = useSessionSync(code, sessionQuery.data?.id, () => {
    if (token) void meQuery.refetch()
  })

  const join = useMutation(
    trpc.session.join.mutationOptions({
      onSuccess: (result) => {
        window.localStorage.setItem(tokenKey(code), result.token)
        setToken(result.token)
      },
    }),
  )

  const session = sessionQuery.data
  const me = meQuery.data

  if (sessionQuery.isPending) return <Shell>Loading…</Shell>
  if (!session) return <Shell>No session with code {code}.</Shell>

  if (me) {
    const team = session.teams.find((entry) => entry.id === me.teamId)
    return (
      <Shell>
        <div className="space-y-1 text-center">
          <p className="font-semibold text-3xl">{me.displayName}</p>
          {team && (
            <p className="font-medium" style={{ color: team.color }}>
              {team.name}
            </p>
          )}
        </div>
        <PlayerConsole
          session={session}
          me={me}
          token={token ?? ''}
          // The buzzer's own result comes back with the mutation, so the phone
          // updates on the round trip it already paid for.
          onActed={(update) => {
            if (!applyMatch(update)) invalidate()
          }}
        />
      </Shell>
    )
  }

  if (!session.registrationOpen) {
    return <Shell>Registration for “{session.name}” is closed.</Shell>
  }

  return (
    <Shell>
      <div className="space-y-1 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">{session.name}</h1>
        <p className="text-muted-foreground text-sm">{session.players.length} already in</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          join.mutate({ code, displayName, teamId: teamId || null })
        }}
      >
        <label className="block space-y-1.5">
          <span className="font-medium text-sm">Your name</span>
          <input
            required
            // biome-ignore lint/a11y/noAutofocus: players land here from a QR scan to type one thing
            autoFocus
            maxLength={24}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="h-11 w-full rounded-md border bg-background px-3 text-base"
          />
        </label>

        {session.teams.length > 0 && (
          <label className="block space-y-1.5">
            <span className="font-medium text-sm">Team</span>
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className="h-11 w-full rounded-md border bg-background px-3 text-base"
            >
              <option value="">Let the host decide</option>
              {session.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {join.error && <p className="text-destructive text-sm">{join.error.message}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={join.isPending}>
          Join
        </Button>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6 py-10">
      {children}
    </main>
  )
}

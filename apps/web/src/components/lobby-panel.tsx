'use client'

import { useMutation } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import { Button } from '@workspace/ui/components/ui/button'
import { useState } from 'react'

type Session = NonNullable<RouterOutputs['session']['byCode']>

export function LobbyPanel({ session, onChanged }: { session: Session; onChanged: () => void }) {
  const trpc = useTRPC()
  const [teamName, setTeamName] = useState('')

  const options = { onSuccess: onChanged }
  const assignTeam = useMutation(trpc.session.assignTeam.mutationOptions(options))
  const removePlayer = useMutation(trpc.session.removePlayer.mutationOptions(options))
  const addTeam = useMutation(
    trpc.session.addTeam.mutationOptions({
      onSuccess: () => {
        setTeamName('')
        onChanged()
      },
    }),
  )
  const removeTeam = useMutation(trpc.session.removeTeam.mutationOptions(options))
  const setRegistration = useMutation(trpc.session.setRegistrationOpen.mutationOptions(options))

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-sm uppercase tracking-wide">
          Players ({session.players.length})
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setRegistration.mutate({ sessionId: session.id, open: !session.registrationOpen })
          }
        >
          {session.registrationOpen ? 'Close signup' : 'Reopen signup'}
        </Button>
      </div>

      {session.players.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nobody yet. The TV is showing a QR code for them to scan.
        </p>
      ) : (
        <ul className="space-y-2">
          {session.players.map((player) => (
            <li key={player.id} className="flex items-center gap-2 rounded-md border p-2">
              <span className="flex-1 truncate text-sm">{player.displayName}</span>
              <select
                value={player.teamId ?? ''}
                className="h-8 rounded-md border bg-background px-2 text-xs"
                onChange={(event) =>
                  assignTeam.mutate({
                    playerId: player.id,
                    teamId: event.target.value || null,
                  })
                }
              >
                <option value="">No team</option>
                {session.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removePlayer.mutate({ playerId: player.id })}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <h2 className="font-medium text-sm uppercase tracking-wide">Teams</h2>
        {session.teams.map((team) => (
          <div key={team.id} className="flex items-center gap-2 rounded-md border p-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: team.color }} />
            <span className="flex-1 truncate text-sm">{team.name}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeTeam.mutate({ teamId: team.id })}
            >
              Remove
            </Button>
          </div>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (teamName.trim()) addTeam.mutate({ sessionId: session.id, name: teamName.trim() })
          }}
        >
          <input
            value={teamName}
            placeholder="Add a team"
            onChange={(event) => setTeamName(event.target.value)}
            className="h-8 flex-1 rounded-md border bg-background px-2 text-sm"
          />
          <Button size="sm" type="submit" variant="outline">
            Add
          </Button>
        </form>
      </div>
    </section>
  )
}

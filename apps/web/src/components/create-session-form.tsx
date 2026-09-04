import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTRPC } from '@workspace/api/react'
import { Button } from '@workspace/ui/components/ui/button'
import { useState } from 'react'

export function CreateSessionForm() {
  const navigate = useNavigate()
  const trpc = useTRPC()
  const [name, setName] = useState('')
  const [teams, setTeams] = useState('')

  const create = useMutation(
    trpc.session.create.mutationOptions({
      onSuccess: (created) => {
        if (created) void navigate({ to: '/host/$code', params: { code: created.code } })
      },
    }),
  )

  return (
    <form
      className="space-y-3 rounded-lg border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        create.mutate({
          name,
          teamNames: teams
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean),
        })
      }}
    >
      <label className="block space-y-1.5">
        <span className="font-medium text-sm">Name</span>
        <input
          required
          value={name}
          placeholder="Dev Friends Night"
          onChange={(event) => setName(event.target.value)}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="font-medium text-sm">Teams</span>
        <input
          value={teams}
          placeholder="Backend, Frontend"
          onChange={(event) => setTeams(event.target.value)}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        />
        <span className="block text-muted-foreground text-xs">
          Comma separated. Family Feud needs at least two; Jeopardy ignores them.
        </span>
      </label>

      {create.error && <p className="text-destructive text-sm">{create.error.message}</p>}

      <Button type="submit" disabled={create.isPending}>
        Create night
      </Button>
    </form>
  )
}

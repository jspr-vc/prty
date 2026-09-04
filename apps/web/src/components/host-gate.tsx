import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC, writeHostPin } from '@workspace/api/react'
import { APP_NAME, HOST_PIN_LENGTH } from '@workspace/common/consts'
import { Button } from '@workspace/ui/components/ui/button'
import { useState } from 'react'

/**
 * The whole of the host's sign-in.
 *
 * There are no accounts: the binary prints a PIN when it starts, and holding
 * that PIN is what makes a browser the host. It is stored locally, sent as a
 * header on every call, and checked against the database per request — so
 * rotating it locks the old console out on its next action rather than at its
 * next reload.
 */
export function HostGate({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const session = useQuery(trpc.host.session.queryOptions())

  if (session.isPending) {
    return <Shell>Checking…</Shell>
  }

  if (session.data?.isHost) return <>{children}</>

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setChecking(true)
    setError(null)

    const result = await queryClient
      .fetchQuery(trpc.host.verify.queryOptions({ pin }))
      .catch(() => ({ ok: false }))

    setChecking(false)
    if (!result.ok) {
      setError('That PIN does not match the one in the terminal.')
      return
    }

    writeHostPin(pin)
    // Every host-only query was rejected while unpaired; none of them is worth
    // keeping. Clearing beats invalidating so nothing renders a stale refusal.
    queryClient.clear()
  }

  return (
    <Shell>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">{APP_NAME}</h1>
          <p className="text-muted-foreground text-sm">
            Enter the host PIN the server printed when it started.
          </p>
        </div>
        <input
          // biome-ignore lint/a11y/noAutofocus: this input is the whole screen
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={HOST_PIN_LENGTH}
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
          className="h-16 w-full rounded-md border bg-background text-center font-mono font-semibold text-4xl tracking-[0.4em] outline-none focus-visible:border-ring"
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={checking || pin.length !== HOST_PIN_LENGTH}
        >
          Pair this console
        </Button>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6">
      {children}
    </main>
  )
}

import { api } from '@workspace/api/server'
import { auth } from '@workspace/auth'
import { APP_NAME } from '@workspace/common/consts'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CreateSessionForm } from '@/components/create-session-form'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/sign-in')

  const sessions = await api.session.mine()

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="space-y-1">
        <h1 className="font-semibold text-3xl tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground text-sm">Signed in as {session.user.email}</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-medium text-sm uppercase tracking-wide">New night</h2>
        <CreateSessionForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-sm uppercase tracking-wide">Your nights</h2>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing yet. Start one above.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {sessions.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/session/${entry.code}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-accent"
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

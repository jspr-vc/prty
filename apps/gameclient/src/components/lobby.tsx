'use client'

import type { RouterOutputs } from '@workspace/api'
import QRCode from 'react-qr-code'
import { env } from '@/env-client'

type Session = NonNullable<RouterOutputs['session']['byCode']>

export function Lobby({ session }: { session: Session }) {
  const joinUrl = `${env.NEXT_PUBLIC_GAMEMASTER_URL}/join/${session.code}`

  return (
    <div className="grid h-svh grid-cols-[minmax(0,1fr)_auto] gap-[4vw] bg-stage p-[4vw] text-stage-fg">
      <div className="flex min-w-0 flex-col">
        <header className="space-y-2">
          <p className="stage-label font-semibold text-stage-accent uppercase tracking-[0.3em]">
            {session.registrationOpen ? 'Scan to join' : 'Signup closed'}
          </p>
          <h1 className="stage-display truncate font-bold tracking-tight">{session.name}</h1>
        </header>

        <div className="mt-10 flex-1 overflow-hidden">
          <p className="stage-label mb-4 text-stage-muted uppercase tracking-wide">
            {session.players.length} in the room
          </p>
          <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {session.players.map((player) => {
              const team = session.teams.find((entry) => entry.id === player.teamId)
              return (
                <li
                  key={player.id}
                  className="gs-rise rounded-lg border border-stage-line bg-stage-panel px-[1.5vw] py-[1.4vh]"
                  style={team ? { borderLeft: `6px solid ${team.color}` } : undefined}
                >
                  <span className="stage-item block truncate font-semibold">
                    {player.displayName}
                  </span>
                  {team && (
                    <span className="stage-caption block truncate text-stage-muted uppercase tracking-wide">
                      {team.name}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <aside className="flex flex-col items-center justify-center gap-6">
        <div className="rounded-2xl border border-stage-line bg-stage-fg p-5">
          <QRCode value={joinUrl} size={280} bgColor="#ebecf0" fgColor="#0a0b0f" />
        </div>
        <div className="text-center">
          <p className="stage-label text-stage-muted uppercase tracking-wide">or go to</p>
          <p className="stage-item font-mono text-stage-fg/80">
            {joinUrl.replace(/^https?:\/\//, '')}
          </p>
          <p className="stage-code mt-4 font-bold text-stage-accent tracking-[0.2em]">
            {session.code}
          </p>
        </div>
      </aside>
    </div>
  )
}

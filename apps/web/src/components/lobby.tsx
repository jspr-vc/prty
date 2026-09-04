import type { RouterOutputs } from '@workspace/api'
import QRCode from 'react-qr-code'

type Session = NonNullable<RouterOutputs['session']['byCode']>

/**
 * Pure black on pure white, fixed, and never a theme token.
 *
 * The stage palette is deliberately soft — an off-white foreground and a
 * near-black ground, tuned so a big panel in a dark room does not glare. That
 * is right for everything else on this screen and wrong for a QR code, which is
 * not being read by a person but by a phone camera thresholding a picture of a
 * television. Maximum contrast is the whole job, so these are hard-coded and
 * stay hard-coded.
 */
const QR_BACKGROUND = '#ffffff'
const QR_FOREGROUND = '#000000'

export function Lobby({ session }: { session: Session }) {
  // Whatever address this screen was opened on is the address the room can
  // reach, so the QR code is built from it. Nothing to configure, and no
  // environment variable that can go stale and point the phones nowhere.
  const joinUrl = `${window.location.origin}/join/${session.code}`

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

      <aside className="flex flex-col items-center justify-center gap-[3vh]">
        {/*
          Sized with `.stage-qr` (a vw clamp) rather than a fixed pixel count.
          A TV browser can report a 3840px viewport, where a 280px code is a
          smudge on the far wall — and a QR code that cannot be resolved is
          exactly as useless as one nobody can scan.

          The white padding is the quiet zone: without a clear margin the
          scanner cannot find the code's edges against the dark stage.
        */}
        <div className="stage-qr rounded-2xl p-[1.2vw]" style={{ backgroundColor: QR_BACKGROUND }}>
          <QRCode
            value={joinUrl}
            size={512}
            // One step up from the default: a phone reading a screen at an
            // angle, through glare, needs the redundancy more than it needs
            // the slightly larger modules.
            level="M"
            bgColor={QR_BACKGROUND}
            fgColor={QR_FOREGROUND}
          />
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

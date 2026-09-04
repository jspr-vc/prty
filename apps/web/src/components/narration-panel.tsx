import { useMutation, useQuery } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { readHostPin, useTRPC } from '@workspace/api/react'
import { NARRATION_MODES, type NarrationMode } from '@workspace/common/consts'
import { getGame, narrateMatch } from '@workspace/games'
import { Button } from '@workspace/ui/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import {
  browserVoices,
  narrate,
  type RenderJob,
  regenerateLine,
  renderStatus,
  startRender,
  ttsCapabilities,
  type Voice,
} from '@/lib/narration'

type Session = NonNullable<RouterOutputs['session']['byCode']>

const LABELS: Record<NarrationMode, string> = {
  off: 'Off',
  clues: 'Questions',
  everything: 'Everything',
}

/**
 * Narration is a property of the night, not of the screen, so it is set here
 * and the TV follows. The voice list is read from *this* browser, which is a
 * small lie the host has to know about: the voices that matter are the TV's.
 * The server's engine is offered as a separate group for exactly that reason —
 * it is the same everywhere.
 */
export function NarrationPanel({ session }: { session: Session }) {
  const trpc = useTRPC()
  const [voices, setVoices] = useState<string[]>([])
  const [serverEngine, setServerEngine] = useState<string | null>(null)
  const [serverVoices, setServerVoices] = useState<Voice[]>([])
  const [serverStatus, setServerStatus] = useState<string | null>(null)

  const capabilities = useQuery({
    queryKey: ['tts-capabilities'],
    queryFn: ttsCapabilities,
    staleTime: Number.POSITIVE_INFINITY,
  })

  useEffect(() => {
    void browserVoices().then((found) => setVoices(found.map((voice) => voice.name)))
  }, [])

  useEffect(() => {
    setServerEngine(capabilities.data?.engine ?? null)
    setServerVoices(capabilities.data?.voices ?? [])
    setServerStatus(capabilities.data?.status ?? null)
  }, [capabilities.data])

  const setNarration = useMutation(trpc.session.setNarration.mutationOptions())
  const replay = useMutation(trpc.session.replayNarration.mutationOptions())

  /**
   * What the big screen would read right now, worked out the same way the TV
   * works it out. The console is not a passenger here: a button that says "say
   * it again" has to be able to say whether there is anything to say.
   */
  const line = useMemo(() => {
    const match = session.activeMatch
    if (!match) return null
    const definition = getGame(match.game.slug)
    if (!definition) return null
    return narrateMatch(definition, match.pack?.content, match.state, {
      players: session.players.map((player) => ({
        id: player.id,
        displayName: player.displayName,
        teamId: player.teamId,
      })),
      teams: session.teams.map((team) => ({ id: team.id, name: team.name, color: team.color })),
    })
  }, [session])

  // Auditioning a voice needs something to say even when the board is quiet.
  const sample = line?.text ?? 'Survey says: this is the voice the room will hear.'

  /**
   * Pre-rendering, watched rather than awaited.
   *
   * The job lives in the server, not in this page, so the console can be
   * reloaded or opened twice mid-render and still show what is happening. It is
   * polled only while it runs.
   */
  /**
   * Redo the clip for the line that is up right now.
   *
   * The small version of the pre-render, for when one line came out wrong: the
   * voice stumbled over a name, or the pack was edited under a slug that had
   * already been rendered. The replay is told the clip is fresh so the TV goes
   * past the day-long cache `/api/tts` hands out.
   */
  const [redoing, setRedoing] = useState(false)
  const redo = async () => {
    if (!line) return
    setRedoing(true)
    const ok = await regenerateLine(
      line.text,
      { rate: session.narrationRate, voice: session.narrationVoice },
      readHostPin(),
    )
    setRedoing(false)
    if (ok) replay.mutate({ sessionId: session.id, fresh: true })
  }

  const render = useQuery({
    queryKey: ['narration-render'],
    queryFn: renderStatus,
    refetchInterval: (query) => (query.state.data?.running ? 700 : false),
  })

  const job: RenderJob | null = render.data ?? null
  const pack = session.activeMatch?.pack?.slug
  const scope = pack ? `this pack (${pack})` : 'every pack'

  const begin = async (regenerate: boolean) => {
    await startRender(
      {
        pack,
        voice: session.narrationVoice,
        rate: session.narrationRate,
        mode: session.narrationMode,
        regenerate,
      },
      readHostPin(),
    )
    await render.refetch()
  }

  const update = (patch: { mode?: NarrationMode; rate?: number; voice?: string | null }) => {
    setNarration.mutate({
      sessionId: session.id,
      mode: patch.mode ?? session.narrationMode,
      rate: patch.rate ?? session.narrationRate,
      voice: patch.voice === undefined ? session.narrationVoice : patch.voice,
    })
  }

  return (
    <section className="space-y-3">
      <h2 className="font-medium text-sm uppercase tracking-wide">Read the board aloud</h2>

      <div className="flex flex-wrap gap-2">
        {NARRATION_MODES.map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={session.narrationMode === mode ? 'default' : 'outline'}
            onClick={() => update({ mode })}
          >
            {LABELS[mode]}
          </Button>
        ))}
      </div>

      {session.narrationMode !== 'off' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={replay.isPending || !line}
              title={line ? 'Play it on the big screen again' : 'Nothing on the board to read'}
              onClick={() => replay.mutate({ sessionId: session.id })}
            >
              Say it again
            </Button>
            {/*
             * On this device, not the TV. Narration lives on the big screen,
             * so a host trying out a voice from the console was pressing a
             * button whose whole effect happened in another room.
             */}
            <Button
              size="sm"
              variant="outline"
              disabled={!line || redoing}
              title={
                line
                  ? 'Render this line again and play the new clip on the big screen'
                  : 'Nothing on the board to re-render'
              }
              onClick={() => void redo()}
            >
              {redoing ? 'Re-rendering…' : 'Re-render this line'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              title="Play it through this device's speakers"
              onClick={() =>
                void narrate(sample, {
                  rate: session.narrationRate,
                  voice: session.narrationVoice,
                })
              }
            >
              Hear it here
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            {line ? (
              <>
                The big screen would read: <span className="italic">“{line.text}”</span>
              </>
            ) : (
              'Nothing on the board to read right now. "Hear it here" plays a sample instead.'
            )}
          </p>
        </div>
      )}

      {session.narrationMode !== 'off' &&
        voices.length === 0 &&
        !serverEngine &&
        !session.narrationVoice && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200 text-xs">
            <span className="font-semibold">Nothing can speak.</span> This browser reports no{' '}
            <code>speechSynthesis</code> voices and the server has no speech engine, so narration
            will be silent. On Linux, browsers get their voices from speech-dispatcher — installing{' '}
            <code>espeak-ng</code> (and <code>speech-dispatcher</code>) fixes both paths at once.
            Restart the server afterwards so it re-detects.
          </p>
        )}

      {session.narrationMode !== 'off' && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="font-medium text-sm">Pre-render {scope}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={job?.running}
              onClick={() => void begin(false)}
            >
              Render missing
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={job?.running}
              onClick={() => void begin(true)}
            >
              Re-render all
            </Button>
          </div>

          {job?.running ? (
            <p className="text-muted-foreground text-xs tabular-nums">
              {job.regenerate ? 'Re-rendering' : 'Rendering'} {job.done}/{job.total} ·{' '}
              {job.rendered} done{job.cached > 0 && `, ${job.cached} already cached`}
              {job.failed > 0 && `, ${job.failed} failed`}
            </p>
          ) : job?.error ? (
            <p className="text-destructive text-xs">{job.error}</p>
          ) : job && job.done > 0 ? (
            <p className="text-muted-foreground text-xs tabular-nums">
              Last run: {job.rendered} rendered
              {job.cached > 0 && `, ${job.cached} already cached`}
              {job.failed > 0 && `, ${job.failed} failed`}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Renders every line at this voice and speed, so the night plays from the cache instead
              of synthesising while the room waits. "Re-render all" replaces clips that are already
              there, for when a pack or a voice has changed.
            </p>
          )}
        </div>
      )}

      {session.narrationMode !== 'off' && (
        <div className="space-y-3 rounded-md border p-3">
          <label className="block space-y-1.5">
            <span className="font-medium text-sm">Speed · {session.narrationRate}%</span>
            <input
              type="range"
              min={50}
              max={150}
              step={5}
              value={session.narrationRate}
              className="w-full"
              onChange={(event) => update({ rate: Number(event.target.value) })}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-medium text-sm">Voice</span>
            <select
              value={session.narrationVoice ?? ''}
              className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              onChange={(event) => update({ voice: event.target.value || null })}
            >
              <option value="">Whatever the TV defaults to</option>
              {serverVoices.length > 0 && (
                <optgroup label={`Server · ${serverEngine} (pre-rendered)`}>
                  {serverVoices.map((voice) => (
                    <option key={`server:${voice.id}`} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {voices.length > 0 && (
                <optgroup label="This browser">
                  {voices.map((voice) => (
                    <option key={`browser:${voice}`} value={voice}>
                      {voice}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {serverVoices.length === 0 && serverStatus && (
              // An absent group looks the same as a group that was never there.
              // The server already knows why, so it says so rather than leaving
              // the host to guess whether they broke something.
              <span className="block text-muted-foreground text-xs">
                No server voices: <span className="font-medium">{serverStatus}</span>. Restart the
                server after installing an engine, then reload this page.
              </span>
            )}
            <span className="block text-muted-foreground text-xs">
              A server voice plays the audio rendered by <code>gameshows narrate</code> — the same
              on every screen, and the only option that works on a TV browser with no voices of its
              own. Browser voices are whatever <em>this</em> machine has, which may not be what the
              TV has.
            </span>
          </label>
        </div>
      )}
    </section>
  )
}

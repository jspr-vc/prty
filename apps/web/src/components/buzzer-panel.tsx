import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RouterOutputs } from '@workspace/api'
import { useTRPC } from '@workspace/api/react'
import { BUZZER_KEYS, BUZZER_RESET_KEY, type BuzzerKey } from '@workspace/common/consts'
import type { BuzzerTarget } from '@workspace/common/schemas'
import { Button } from '@workspace/ui/components/ui/button'
import { cn } from '@workspace/ui/lib/utils'

type Session = NonNullable<RouterOutputs['session']['byCode']>

interface Props {
  session: Session
  /** The target the next pad press should be bound to, if the host is pairing. */
  capturing: BuzzerTarget | null
  onCapturingChange: (target: BuzzerTarget | null) => void
  onReset: () => void
}

function targetKey(target: BuzzerTarget): string {
  return target.kind === 'player' ? `player:${target.playerId}` : `team:${target.teamId}`
}

/**
 * Pairing a physical buzzer set.
 *
 * Pressing the pad is the way to do it, because nobody knows which pad is which
 * until they press one: the host picks a person, presses their pad, and
 * whatever key that pad sent becomes theirs. This is why the key listener lives
 * in the console rather than here — the same press either pairs a pad or
 * buzzes, and only one of the two can be true at a time.
 *
 * The dropdown is the other way, for when pressing is not an option: a pad that
 * is across the room, one that has stopped reporting, or a set whose labels the
 * host already knows. It writes the same binding the press would have.
 */
export function BuzzerPanel({ session, capturing, onCapturingChange, onReset }: Props) {
  const trpc = useTRPC()
  const bindings = useQuery(trpc.buzzer.list.queryOptions({ sessionId: session.id }))

  const queryClient = useQueryClient()
  // The list is refreshed by the `buzzers_updated` broadcast, but the host
  // should not be waiting on their own round trip to see a pad move — and the
  // dropdown must not spring back to its old value in the meantime.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.buzzer.list.queryKey() })
  }

  const bind = useMutation(trpc.buzzer.bind.mutationOptions({ onSuccess: refresh }))
  const unbind = useMutation(trpc.buzzer.unbind.mutationOptions({ onSuccess: refresh }))
  const clear = useMutation(trpc.buzzer.clear.mutationOptions({ onSuccess: refresh }))

  const boundFor = new Map<string, BuzzerKey>()
  /** Who each pad currently belongs to, so the dropdown can say whose it is. */
  const ownerOf = new Map<BuzzerKey, string>()
  for (const binding of bindings.data ?? []) {
    const target: BuzzerTarget =
      binding.kind === 'player'
        ? { kind: 'player', playerId: binding.playerId as string }
        : { kind: 'team', teamId: binding.teamId as string }
    boundFor.set(targetKey(target), binding.key as BuzzerKey)
    const owner = binding.kind === 'player' ? binding.player?.displayName : binding.team?.name
    if (owner) ownerOf.set(binding.key as BuzzerKey, owner)
  }

  /**
   * Move a target onto a pad, or off pads entirely.
   *
   * Only the release is done here. Binding drops whatever pad this target held
   * before — server-side, in one transaction — because the press-to-pair path
   * needs the same thing and neither should be able to leave somebody holding
   * two pads.
   */
  const assign = (target: BuzzerTarget, next: BuzzerKey | null) => {
    const previous = boundFor.get(targetKey(target))
    if (previous === next) return
    // Binding a pad someone else holds hands it over, which is what the
    // dropdown's owner labels are there to warn about.
    if (next) bind.mutate({ sessionId: session.id, key: next, target })
    else if (previous) unbind.mutate({ sessionId: session.id, key: previous })
  }

  const rows: { target: BuzzerTarget; label: string; sub?: string }[] = [
    ...session.teams.map((team) => ({
      target: { kind: 'team', teamId: team.id } as BuzzerTarget,
      label: team.name,
      sub: representativeOf(session, team.id),
    })),
    ...session.players.map((player) => ({
      target: { kind: 'player', playerId: player.id } as BuzzerTarget,
      label: player.displayName,
    })),
  ]

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-sm uppercase tracking-wide">Buzzers</h2>
        <Button size="sm" variant="outline" onClick={onReset}>
          Re-arm
        </Button>
      </div>

      {capturing ? (
        <p className="gs-pop rounded-md bg-amber-400 px-3 py-2 text-center font-semibold text-black text-sm">
          Press the pad now…{' '}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => onCapturingChange(null)}
          >
            cancel
          </button>
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Pick someone, then press their pad, or choose the pad from the dropdown if you already
          know which is which. Pads send F13–F23; {BUZZER_RESET_KEY} re-arms the room. Phones keep
          working either way.
        </p>
      )}

      <ul className="space-y-2">
        {rows.map((row) => {
          const key = boundFor.get(targetKey(row.target))
          const isCapturing = capturing !== null && targetKey(capturing) === targetKey(row.target)
          return (
            <li
              key={targetKey(row.target)}
              className={cn(
                'flex items-center gap-2 rounded-md border p-2',
                isCapturing && 'border-amber-400',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{row.label}</span>
                {row.sub && (
                  <span className="block truncate text-muted-foreground text-xs">{row.sub}</span>
                )}
              </span>
              <select
                aria-label={`Pad for ${row.label}`}
                className="h-8 rounded-md border bg-background px-1 font-mono text-xs"
                value={key ?? ''}
                onChange={(event) => {
                  const chosen = event.target.value
                  onCapturingChange(null)
                  assign(row.target, chosen === '' ? null : (chosen as BuzzerKey))
                }}
              >
                <option value="">No pad</option>
                {BUZZER_KEYS.map((pad) => {
                  const owner = ownerOf.get(pad)
                  return (
                    <option key={pad} value={pad}>
                      {pad}
                      {owner && pad !== key ? ` · ${owner}` : ''}
                    </option>
                  )
                })}
              </select>
              <Button
                size="sm"
                variant={isCapturing ? 'default' : 'outline'}
                aria-label={`Pair a pad to ${row.label} by pressing it`}
                onClick={() => onCapturingChange(isCapturing ? null : row.target)}
              >
                {isCapturing ? 'Listening…' : 'Press pad'}
              </Button>
            </li>
          )
        })}
      </ul>

      {(bindings.data?.length ?? 0) > 0 && (
        <Button size="sm" variant="ghost" onClick={() => clear.mutate({ sessionId: session.id })}>
          Unpair all {bindings.data?.length} pad(s)
        </Button>
      )}

      {(bindings.data?.length ?? 0) >= BUZZER_KEYS.length && (
        <p className="text-muted-foreground text-xs">Every pad this build knows about is paired.</p>
      )}
    </section>
  )
}

/**
 * A team's pad buzzes as its earliest joiner — their face-off representative.
 * Saying so here means the host is never guessing whose name will light up.
 */
function representativeOf(session: Session, teamId: string): string | undefined {
  const first = session.players.find((player) => player.teamId === teamId)
  return first ? `buzzes as ${first.displayName}` : 'nobody on this team yet'
}

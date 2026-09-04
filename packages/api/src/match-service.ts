import { TRPCError } from '@trpc/server'
import { BUZZER_DEBOUNCE_MS, BUZZER_RESET_KEY } from '@workspace/common/consts'
import { and, asc, type Database, eq, sql } from '@workspace/db'
import { buzzerBinding, match, matchEvent, sessionPlayer, team } from '@workspace/db/schema'
import {
  type AppliedAction,
  applyAction,
  applyBuzzerAction,
  applyBuzzerReset,
  applyPlayerAction,
  getGame,
} from '@workspace/games'
import { broadcastToSession } from '@workspace/realtime/server'
import { toMatchContext } from './match-context'
import { withMatchLock } from './write-queue'

/**
 * The match, the game, the pack and the room, in one query. The reducer needs
 * all four, and three sequential round trips to the database before the first
 * byte of work is three round trips the room waits through.
 */
const withRoom = {
  game: true,
  pack: true,
  session: {
    with: {
      players: { orderBy: asc(sessionPlayer.joinedAt) },
      teams: { orderBy: asc(team.position) },
    },
  },
} as const

export async function loadMatch(db: Database, matchId: string) {
  const found = await db.query.match.findFirst({ where: eq(match.id, matchId), with: withRoom })
  if (!found) throw new TRPCError({ code: 'NOT_FOUND', message: 'No such match' })
  if (!found.pack) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Match has no question pack' })
  }
  return found
}

type LoadedMatch = Awaited<ReturnType<typeof loadMatch>>

/** What a write returns to its caller, and what the room is told. */
export interface MatchUpdate {
  matchId: string
  rev: number
  state: unknown
  changed: boolean
}

/**
 * The single place a reduced state reaches the database and the room.
 *
 * Synchronous throughout: `bun:sqlite` is a synchronous driver, so an `await`
 * inside the transaction callback would let the transaction commit before the
 * work inside it had finished.
 */
function commit(
  db: Database,
  found: { id: string; sessionId: string; rev: number; state: unknown },
  applied: AppliedAction,
  actorPlayerId: string | null,
): MatchUpdate {
  // A reducer returns its input untouched when it rejects an action, so there
  // is nothing to log and nobody to notify.
  if (!applied.changed) {
    return { matchId: found.id, rev: found.rev, state: found.state, changed: false }
  }

  const rev = db.transaction((tx) => {
    tx.insert(matchEvent)
      .values({
        matchId: found.id,
        actorPlayerId,
        type: applied.action.type,
        payload: applied.action as Record<string, unknown>,
      })
      .run()

    const updated = tx
      .update(match)
      .set({
        state: applied.state as Record<string, unknown>,
        // Incremented in the database, not read-then-written, so two actions
        // landing together still get distinct, ordered revisions.
        rev: sql`${match.rev} + 1`,
      })
      .where(eq(match.id, found.id))
      .returning({ rev: match.rev })
      .get()

    return updated?.rev ?? found.rev + 1
  })

  // The state travels with the notification. Clients render it directly instead
  // of asking for it back, which takes a whole round trip out of every action.
  broadcastToSession(found.sessionId, {
    type: 'match_updated',
    matchId: found.id,
    rev,
    state: applied.state,
  })

  return { matchId: found.id, rev, state: applied.state, changed: true }
}

function definitionFor(found: LoadedMatch) {
  const definition = getGame(found.game.slug)
  if (!definition) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown game' })
  return definition
}

function requireActive(found: LoadedMatch) {
  if (found.status !== 'active') {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Match is not active' })
  }
}

/**
 * The single write path for gameplay. The reducer runs here, never on a client,
 * so the host console and the TV can never disagree about what happened.
 */
export function dispatchHostAction(
  db: Database,
  matchId: string,
  action: unknown,
): Promise<MatchUpdate> {
  return withMatchLock(matchId, async () => {
    const found = await loadMatch(db, matchId)
    requireActive(found)
    const definition = definitionFor(found)
    const ctx = toMatchContext(found.session.players, found.session.teams)

    let applied: AppliedAction
    try {
      applied = applyAction(definition, found.pack?.content, found.state, action, ctx)
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid action for this match',
        cause: error,
      })
    }

    return commit(db, found, applied, null)
  })
}

/**
 * The write path for players' phones. Authenticated by the join token rather
 * than the host PIN: nobody signs in to play, they just scan the QR code.
 */
export function dispatchPlayerAction(
  db: Database,
  matchId: string,
  token: string,
  action: unknown,
): Promise<MatchUpdate> {
  return withMatchLock(matchId, async () => {
    const found = await loadMatch(db, matchId)
    requireActive(found)

    // The room came back with the match, so the caller is checked against it
    // rather than with another query. The token still decides, never a payload.
    const player = found.session.players.find((entry) => entry.token === token)
    if (!player) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not in this session' })

    const definition = definitionFor(found)
    const ctx = toMatchContext(found.session.players, found.session.teams)
    const applied = applyPlayerAction(
      definition,
      found.pack?.content,
      found.state,
      action,
      player.id,
      ctx,
    )
    if (!applied) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot do that right now' })
    }

    return commit(db, found, applied, player.id)
  })
}

/**
 * Holding a pad down makes the operating system repeat the key, and contacts
 * bounce. Both look like a burst of presses a few milliseconds apart, and both
 * are the same press.
 */
const lastPress = new Map<string, number>()

function debounced(sessionId: string, key: string): boolean {
  const id = `${sessionId}:${key}`
  const now = Date.now()
  const previous = lastPress.get(id)
  if (previous !== undefined && now - previous < BUZZER_DEBOUNCE_MS) return true
  lastPress.set(id, now)
  return false
}

/**
 * Which player a pad speaks for.
 *
 * A pad bound to a team buzzes as that team's first player by join order —
 * their face-off representative. Both reducers key their buzz off a player id,
 * so a team binding has to resolve to somebody; picking the earliest joiner
 * makes it stable across a night rather than shuffling per render.
 */
export function resolveBuzzerPlayer(db: Database, sessionId: string, key: string): string | null {
  const binding = db
    .select()
    .from(buzzerBinding)
    .where(and(eq(buzzerBinding.sessionId, sessionId), eq(buzzerBinding.key, key)))
    .get()
  if (!binding) return null

  if (binding.kind === 'player') return binding.playerId
  if (!binding.teamId) return null

  return (
    db
      .select({ id: sessionPlayer.id })
      .from(sessionPlayer)
      .where(and(eq(sessionPlayer.sessionId, sessionId), eq(sessionPlayer.teamId, binding.teamId)))
      .orderBy(asc(sessionPlayer.joinedAt))
      .get()?.id ?? null
  )
}

export type BuzzerOutcome =
  | { status: 'applied'; update: MatchUpdate }
  | { status: 'ignored'; reason: 'debounced' | 'unbound' | 'no-match' | 'rejected' }

/**
 * A press on a physical pad, from wherever it was seen — the TV, the host
 * console, or a bridge talking straight to the WebSocket.
 *
 * Never throws for an ordinary miss. A pad nobody has bound yet, a press
 * between matches and a press the reducer declines are all normal things to do
 * to a buzzer, and none of them should surface as an error on a screen.
 */
export function pressBuzzer(db: Database, sessionId: string, key: string): Promise<BuzzerOutcome> {
  const active = db
    .select({ id: match.id })
    .from(match)
    .where(and(eq(match.sessionId, sessionId), eq(match.status, 'active')))
    .get()
  if (!active) return Promise.resolve({ status: 'ignored', reason: 'no-match' })

  if (debounced(sessionId, key)) {
    return Promise.resolve({ status: 'ignored', reason: 'debounced' })
  }

  const isReset = key === BUZZER_RESET_KEY
  const playerId = isReset ? null : resolveBuzzerPlayer(db, sessionId, key)
  if (!isReset && !playerId) return Promise.resolve({ status: 'ignored', reason: 'unbound' })

  return withMatchLock(active.id, async () => {
    const found = await loadMatch(db, active.id)
    if (found.status !== 'active') return { status: 'ignored', reason: 'no-match' } as const

    const definition = definitionFor(found)
    const ctx = toMatchContext(found.session.players, found.session.teams)

    const applied = isReset
      ? applyBuzzerReset(definition, found.pack?.content, found.state, ctx)
      : applyBuzzerAction(definition, found.pack?.content, found.state, playerId as string, ctx)

    if (!applied) return { status: 'ignored', reason: 'rejected' } as const

    return { status: 'applied', update: commit(db, found, applied, playerId) } as const
  })
}

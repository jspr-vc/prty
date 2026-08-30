import { TRPCError } from '@trpc/server'
import { gameSlugSchema, playerTokenSchema } from '@workspace/common/schemas'
import { and, asc, eq } from '@workspace/db'
import {
  game,
  gamePack,
  gameSession,
  match,
  matchEvent,
  sessionPlayer,
  team,
} from '@workspace/db/schema'
import { applyAction, applyPlayerAction, createInitialState, getGame } from '@workspace/games'
import { broadcastToSession } from '@workspace/realtime/server'
import { z } from 'zod'
import { toMatchContext } from '../match-context'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'

async function loadMatch(db: typeof import('@workspace/db').db, matchId: string) {
  const found = await db.query.match.findFirst({
    where: eq(match.id, matchId),
    with: { game: true, pack: true },
  })
  if (!found) throw new TRPCError({ code: 'NOT_FOUND', message: 'No such match' })
  if (!found.pack) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Match has no question pack' })
  }
  return found
}

async function loadContext(db: typeof import('@workspace/db').db, sessionId: string) {
  const [players, teams] = await Promise.all([
    db.query.sessionPlayer.findMany({
      where: eq(sessionPlayer.sessionId, sessionId),
      orderBy: asc(sessionPlayer.joinedAt),
    }),
    db.query.team.findMany({ where: eq(team.sessionId, sessionId), orderBy: asc(team.position) }),
  ])
  return toMatchContext(players, teams)
}

/** The single place a reduced state reaches the database and the room. */
async function commit(
  db: typeof import('@workspace/db').db,
  found: { id: string; sessionId: string },
  applied: { state: unknown; changed: boolean; action: { type: string } },
  actorPlayerId: string | null,
) {
  // A reducer returns its input untouched when it rejects an action, so there
  // is nothing to log and nobody to notify.
  if (!applied.changed) return null

  const [updated] = await db.transaction(async (tx) => {
    await tx.insert(matchEvent).values({
      matchId: found.id,
      actorPlayerId,
      type: applied.action.type,
      payload: applied.action as Record<string, unknown>,
    })
    return tx
      .update(match)
      .set({ state: applied.state as Record<string, unknown> })
      .where(eq(match.id, found.id))
      .returning()
  })

  await broadcastToSession(found.sessionId, { type: 'match_updated', matchId: found.id })
  return updated ?? null
}

export const matchRouter = createTRPCRouter({
  byId: publicProcedure.input(z.uuid()).query(({ ctx, input }) =>
    ctx.db.query.match.findFirst({
      where: eq(match.id, input),
      with: { game: true, pack: true },
    }),
  ),

  create: protectedProcedure
    .input(z.object({ sessionId: z.uuid(), gameSlug: gameSlugSchema, packId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const definition = getGame(input.gameSlug)
      if (!definition) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown game' })

      const [row, pack] = await Promise.all([
        ctx.db.query.game.findFirst({ where: eq(game.slug, input.gameSlug) }),
        ctx.db.query.gamePack.findFirst({ where: eq(gamePack.id, input.packId) }),
      ])
      if (!row || !pack) throw new TRPCError({ code: 'NOT_FOUND' })

      const matchCtx = await loadContext(ctx.db, input.sessionId)
      if (matchCtx.players.length < definition.minPlayers) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `${definition.name} needs at least ${definition.minPlayers} players`,
        })
      }

      const state = createInitialState(definition, pack.content, matchCtx)

      const created = await ctx.db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(match)
          .values({
            sessionId: input.sessionId,
            gameId: row.id,
            packId: pack.id,
            status: 'active',
            state: state as Record<string, unknown>,
            startedAt: new Date(),
          })
          .returning()
        if (!inserted) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

        await tx
          .update(gameSession)
          .set({ activeMatchId: inserted.id, status: 'active' })
          .where(eq(gameSession.id, input.sessionId))

        return inserted
      })

      await broadcastToSession(input.sessionId, { type: 'match_started', matchId: created.id })
      return created
    }),

  /**
   * The single write path for gameplay. The reducer runs here, never on a client,
   * so the host console and the TV can never disagree about what happened.
   */
  dispatch: protectedProcedure
    .input(z.object({ matchId: z.uuid(), action: z.unknown() }))
    .mutation(async ({ ctx, input }) => {
      const found = await loadMatch(ctx.db, input.matchId)
      const definition = getGame(found.game.slug)
      if (!definition) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown game' })
      if (found.status !== 'active') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Match is not active' })
      }

      const matchCtx = await loadContext(ctx.db, found.sessionId)

      let applied: ReturnType<typeof applyAction>
      try {
        applied = applyAction(definition, found.pack?.content, found.state, input.action, matchCtx)
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid action for this match',
          cause: error,
        })
      }

      return (await commit(ctx.db, found, applied, null)) ?? found
    }),

  /**
   * The write path for players' phones. Authenticated by the join token rather
   * than a session cookie: nobody signs in to play, they just scan the QR code.
   */
  playerAction: publicProcedure
    .input(
      z.object({
        matchId: z.uuid(),
        token: playerTokenSchema,
        action: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const found = await loadMatch(ctx.db, input.matchId)
      if (found.status !== 'active') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Match is not active' })
      }

      const player = await ctx.db.query.sessionPlayer.findFirst({
        where: and(
          eq(sessionPlayer.token, input.token),
          eq(sessionPlayer.sessionId, found.sessionId),
        ),
      })
      if (!player) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not in this session' })

      const definition = getGame(found.game.slug)
      if (!definition) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown game' })

      const matchCtx = await loadContext(ctx.db, found.sessionId)
      const applied = applyPlayerAction(
        definition,
        found.pack?.content,
        found.state,
        input.action,
        player.id,
        matchCtx,
      )
      if (!applied) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot do that right now' })
      }

      await commit(ctx.db, found, applied, player.id)
      return { ok: true }
    }),

  end: protectedProcedure
    .input(z.object({ matchId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const found = await loadMatch(ctx.db, input.matchId)

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(match)
          .set({ status: 'finished', endedAt: new Date() })
          .where(eq(match.id, found.id))
        await tx
          .update(gameSession)
          .set({ activeMatchId: null })
          .where(eq(gameSession.id, found.sessionId))
      })

      await broadcastToSession(found.sessionId, { type: 'match_ended', matchId: found.id })
    }),

  events: publicProcedure.input(z.uuid()).query(({ ctx, input }) =>
    ctx.db.query.matchEvent.findMany({
      where: eq(matchEvent.matchId, input),
      orderBy: asc(matchEvent.createdAt),
    }),
  ),
})

import { TRPCError } from '@trpc/server'
import { buzzerKeySchema, gameSlugSchema, playerTokenSchema } from '@workspace/common/schemas'
import type { Database } from '@workspace/db'
import { asc, eq } from '@workspace/db'
import {
  game,
  gamePack,
  gameSession,
  match,
  matchEvent,
  sessionPlayer,
  team,
} from '@workspace/db/schema'
import { createInitialState, getGame } from '@workspace/games'
import { broadcastToSession } from '@workspace/realtime/server'
import { z } from 'zod'
import { toMatchContext } from '../match-context'
import {
  dispatchHostAction,
  dispatchPlayerAction,
  loadMatch,
  type MatchUpdate,
  pressBuzzer,
} from '../match-service'
import { createTRPCRouter, hostProcedure, publicProcedure } from '../trpc'

async function loadContext(db: Database, sessionId: string) {
  const [players, teams] = await Promise.all([
    db.query.sessionPlayer.findMany({
      where: eq(sessionPlayer.sessionId, sessionId),
      orderBy: asc(sessionPlayer.joinedAt),
    }),
    db.query.team.findMany({ where: eq(team.sessionId, sessionId), orderBy: asc(team.position) }),
  ])
  return toMatchContext(players, teams)
}

export const matchRouter = createTRPCRouter({
  byId: publicProcedure.input(z.uuid()).query(({ ctx, input }) =>
    ctx.db.query.match.findFirst({
      where: eq(match.id, input),
      with: { game: true, pack: true },
    }),
  ),

  create: hostProcedure
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

      const created = ctx.db.transaction((tx) => {
        const inserted = tx
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
          .get()
        if (!inserted) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

        tx.update(gameSession)
          .set({ activeMatchId: inserted.id, status: 'active' })
          .where(eq(gameSession.id, input.sessionId))
          .run()

        return inserted
      })

      // Not the state: a new match brings a new pack with it, and that is a
      // whole board. Everyone refetches once, then rides the broadcasts.
      broadcastToSession(input.sessionId, { type: 'match_started', matchId: created.id })
      return created
    }),

  dispatch: hostProcedure
    .input(z.object({ matchId: z.uuid(), action: z.unknown() }))
    .mutation(
      ({ ctx, input }): Promise<MatchUpdate> =>
        dispatchHostAction(ctx.db, input.matchId, input.action),
    ),

  playerAction: publicProcedure
    .input(z.object({ matchId: z.uuid(), token: playerTokenSchema, action: z.unknown() }))
    .mutation(
      ({ ctx, input }): Promise<MatchUpdate> =>
        dispatchPlayerAction(ctx.db, input.matchId, input.token, input.action),
    ),

  /**
   * A press on a physical pad, seen by whichever screen the buzzer box is
   * plugged into. Public on purpose: the TV has no PIN, and the pads only do
   * what a binding already says they do.
   */
  buzzer: publicProcedure
    .input(z.object({ sessionId: z.uuid(), key: buzzerKeySchema }))
    .mutation(({ ctx, input }) => pressBuzzer(ctx.db, input.sessionId, input.key)),

  end: hostProcedure.input(z.object({ matchId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const found = await loadMatch(ctx.db, input.matchId)

    ctx.db.transaction((tx) => {
      tx.update(match)
        .set({ status: 'finished', endedAt: new Date() })
        .where(eq(match.id, found.id))
        .run()
      tx.update(gameSession)
        .set({ activeMatchId: null })
        .where(eq(gameSession.id, found.sessionId))
        .run()
    })

    broadcastToSession(found.sessionId, { type: 'match_ended', matchId: found.id })
  }),

  events: publicProcedure.input(z.uuid()).query(({ ctx, input }) =>
    ctx.db.query.matchEvent.findMany({
      where: eq(matchEvent.matchId, input),
      orderBy: asc(matchEvent.createdAt),
    }),
  ),
})

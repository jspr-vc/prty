import { TRPCError } from '@trpc/server'
import { TEAM_COLORS } from '@workspace/common/consts'
import {
  createSessionSchema,
  displayNameSchema,
  joinSessionSchema,
  narrationModeSchema,
  narrationRateSchema,
  playerTokenSchema,
  sessionCodeSchema,
} from '@workspace/common/schemas'
import { generatePlayerToken, generateSessionCode } from '@workspace/common/utils'
import { and, asc, type Database, desc, eq } from '@workspace/db'
import { gameSession, sessionPlayer, team } from '@workspace/db/schema'
import { broadcastToSession } from '@workspace/realtime/server'
import { z } from 'zod'
import { createTRPCRouter, hostProcedure, publicProcedure } from '../trpc'

const withEverything = {
  teams: { orderBy: asc(team.position) },
  players: {
    orderBy: asc(sessionPlayer.joinedAt),
    // `byCode` is public — anyone with the code can read it, including the TV.
    // A join token authorises that player's actions, so it never ships here;
    // a phone already holds its own from `join`.
    columns: { token: false },
  },
  activeMatch: { with: { game: true, pack: true } },
} as const

async function loadByCode(db: Database, code: string) {
  const found = await db.query.gameSession.findFirst({
    where: eq(gameSession.code, code),
    with: withEverything,
  })
  if (!found) throw new TRPCError({ code: 'NOT_FOUND', message: 'No session with that code' })
  return found
}

/** Session codes are short, so collisions are possible; retry a handful of times. */
async function allocateCode(db: Database): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateSessionCode()
    const taken = await db.query.gameSession.findFirst({ where: eq(gameSession.code, code) })
    if (!taken) return code
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not allocate a code' })
}

export const sessionRouter = createTRPCRouter({
  /** Read model for the TV and every player phone. No PIN: the code is the key. */
  byCode: publicProcedure
    .input(sessionCodeSchema)
    .query(({ ctx, input }) => loadByCode(ctx.db, input)),

  /** Every night this box has hosted. There is only one host. */
  list: hostProcedure.query(({ ctx }) =>
    ctx.db.query.gameSession.findMany({
      orderBy: desc(gameSession.createdAt),
      with: { players: { columns: { token: false } } },
    }),
  ),

  create: hostProcedure.input(createSessionSchema).mutation(async ({ ctx, input }) => {
    const code = await allocateCode(ctx.db)

    return ctx.db.transaction((tx) => {
      const created = tx.insert(gameSession).values({ code, name: input.name }).returning().get()
      if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

      if (input.teamNames.length > 0) {
        tx.insert(team)
          .values(
            input.teamNames.map((name, index) => ({
              sessionId: created.id,
              name,
              color: TEAM_COLORS[index % TEAM_COLORS.length] as string,
              position: index,
            })),
          )
          .run()
      }

      return created
    })
  }),

  /** Called from a player's phone after scanning the TV's QR code. */
  join: publicProcedure.input(joinSessionSchema).mutation(async ({ ctx, input }) => {
    const session = await loadByCode(ctx.db, input.code)

    if (!session.registrationOpen) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Registration is closed' })
    }
    if (session.players.some((player) => player.displayName === input.displayName)) {
      throw new TRPCError({ code: 'CONFLICT', message: 'That name is taken' })
    }
    if (input.teamId && !session.teams.some((entry) => entry.id === input.teamId)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown team' })
    }

    const player = ctx.db
      .insert(sessionPlayer)
      .values({
        sessionId: session.id,
        teamId: input.teamId ?? null,
        token: generatePlayerToken(),
        displayName: input.displayName,
      })
      .returning()
      .get()
    if (!player) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

    broadcastToSession(session.id, {
      type: 'player_joined',
      playerId: player.id,
      displayName: player.displayName,
    })

    return { sessionId: session.id, playerId: player.id, token: player.token }
  }),

  /** Lets a returning phone recover its identity from a token in local storage. */
  me: publicProcedure
    .input(z.object({ code: sessionCodeSchema, token: playerTokenSchema }))
    .query(async ({ ctx, input }) => {
      const session = await loadByCode(ctx.db, input.code)
      return (
        (await ctx.db.query.sessionPlayer.findFirst({
          where: and(eq(sessionPlayer.token, input.token), eq(sessionPlayer.sessionId, session.id)),
        })) ?? null
      )
    }),

  setRegistrationOpen: hostProcedure
    .input(z.object({ sessionId: z.uuid(), open: z.boolean() }))
    .mutation(({ ctx, input }) => {
      ctx.db
        .update(gameSession)
        .set({ registrationOpen: input.open })
        .where(eq(gameSession.id, input.sessionId))
        .run()
      broadcastToSession(input.sessionId, { type: 'session_updated' })
    }),

  /** How much of the board the big screen reads out loud, and in whose voice. */
  setNarration: hostProcedure
    .input(
      z.object({
        sessionId: z.uuid(),
        mode: narrationModeSchema,
        rate: narrationRateSchema.optional(),
        voice: z.string().max(120).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      ctx.db
        .update(gameSession)
        .set({
          narrationMode: input.mode,
          ...(input.rate === undefined ? {} : { narrationRate: input.rate }),
          ...(input.voice === undefined ? {} : { narrationVoice: input.voice }),
        })
        .where(eq(gameSession.id, input.sessionId))
        .run()
      broadcastToSession(input.sessionId, { type: 'session_updated' })
    }),

  /**
   * Read the current line again.
   *
   * Nothing is written: the line to read is whatever the board already says,
   * and the big screen is the one holding the voice. So this is a bare command
   * down the socket, which also means a screen that was not connected simply
   * misses it rather than replaying it late on reconnect.
   */
  replayNarration: hostProcedure
    .input(z.object({ sessionId: z.uuid(), fresh: z.boolean().optional() }))
    .mutation(({ input }) => {
      broadcastToSession(input.sessionId, { type: 'narration_replay', fresh: input.fresh })
    }),

  renamePlayer: hostProcedure
    .input(z.object({ playerId: z.uuid(), displayName: displayNameSchema }))
    .mutation(({ ctx, input }) => {
      const updated = ctx.db
        .update(sessionPlayer)
        .set({ displayName: input.displayName })
        .where(eq(sessionPlayer.id, input.playerId))
        .returning()
        .get()
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' })
      broadcastToSession(updated.sessionId, { type: 'session_updated' })
    }),

  assignTeam: hostProcedure
    .input(z.object({ playerId: z.uuid(), teamId: z.uuid().nullable() }))
    .mutation(({ ctx, input }) => {
      const updated = ctx.db
        .update(sessionPlayer)
        .set({ teamId: input.teamId })
        .where(eq(sessionPlayer.id, input.playerId))
        .returning()
        .get()
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' })
      broadcastToSession(updated.sessionId, { type: 'teams_updated' })
    }),

  removePlayer: hostProcedure.input(z.object({ playerId: z.uuid() })).mutation(({ ctx, input }) => {
    const removed = ctx.db
      .delete(sessionPlayer)
      .where(eq(sessionPlayer.id, input.playerId))
      .returning()
      .get()
    if (!removed) throw new TRPCError({ code: 'NOT_FOUND' })
    broadcastToSession(removed.sessionId, { type: 'player_left', playerId: removed.id })
  }),

  addTeam: hostProcedure
    .input(z.object({ sessionId: z.uuid(), name: z.string().trim().min(1).max(24) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.team.findMany({
        where: eq(team.sessionId, input.sessionId),
      })
      const created = ctx.db
        .insert(team)
        .values({
          sessionId: input.sessionId,
          name: input.name,
          color: TEAM_COLORS[existing.length % TEAM_COLORS.length] as string,
          position: existing.length,
        })
        .returning()
        .get()
      broadcastToSession(input.sessionId, { type: 'teams_updated' })
      return created
    }),

  removeTeam: hostProcedure.input(z.object({ teamId: z.uuid() })).mutation(({ ctx, input }) => {
    const removed = ctx.db.delete(team).where(eq(team.id, input.teamId)).returning().get()
    if (!removed) throw new TRPCError({ code: 'NOT_FOUND' })
    broadcastToSession(removed.sessionId, { type: 'teams_updated' })
  }),

  /**
   * Deletes a night and everything under it.
   *
   * The cascades do the work — teams, players, buzzer bindings, matches and
   * their event logs all hang off the session with `on delete cascade`, so this
   * is one statement rather than a hand-written teardown that would rot the
   * moment a table was added.
   *
   * The room is told first. Once the row is gone `byCode` throws NOT_FOUND, and
   * a TV still holding the old read would otherwise sit there showing a lobby
   * for a night that no longer exists.
   */
  remove: hostProcedure.input(z.object({ sessionId: z.uuid() })).mutation(({ ctx, input }) => {
    broadcastToSession(input.sessionId, { type: 'session_updated' })
    const removed = ctx.db
      .delete(gameSession)
      .where(eq(gameSession.id, input.sessionId))
      .returning()
      .get()
    if (!removed) throw new TRPCError({ code: 'NOT_FOUND' })
    return { code: removed.code, name: removed.name }
  }),

  finish: hostProcedure.input(z.object({ sessionId: z.uuid() })).mutation(({ ctx, input }) => {
    ctx.db
      .update(gameSession)
      .set({ status: 'finished', activeMatchId: null })
      .where(eq(gameSession.id, input.sessionId))
      .run()
    broadcastToSession(input.sessionId, { type: 'session_updated' })
  }),
})

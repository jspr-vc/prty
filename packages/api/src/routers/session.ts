import { TRPCError } from '@trpc/server'
import { TEAM_COLORS } from '@workspace/common/consts'
import {
  createSessionSchema,
  displayNameSchema,
  joinSessionSchema,
  playerTokenSchema,
  sessionCodeSchema,
} from '@workspace/common/schemas'
import { generatePlayerToken, generateSessionCode } from '@workspace/common/utils'
import { and, asc, desc, eq } from '@workspace/db'
import { gameSession, sessionPlayer, team } from '@workspace/db/schema'
import { broadcastToSession } from '@workspace/realtime/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'

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

async function loadByCode(db: typeof import('@workspace/db').db, code: string) {
  const found = await db.query.gameSession.findFirst({
    where: eq(gameSession.code, code),
    with: withEverything,
  })
  if (!found) throw new TRPCError({ code: 'NOT_FOUND', message: 'No session with that code' })
  return found
}

/** Session codes are short, so collisions are possible; retry a handful of times. */
async function allocateCode(db: typeof import('@workspace/db').db): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateSessionCode()
    const taken = await db.query.gameSession.findFirst({ where: eq(gameSession.code, code) })
    if (!taken) return code
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not allocate a code' })
}

export const sessionRouter = createTRPCRouter({
  /** Read model for the TV and every player phone. No auth: the code is the key. */
  byCode: publicProcedure
    .input(sessionCodeSchema)
    .query(({ ctx, input }) => loadByCode(ctx.db, input)),

  mine: protectedProcedure.query(({ ctx }) =>
    ctx.db.query.gameSession.findMany({
      where: eq(gameSession.hostUserId, ctx.user.id),
      orderBy: desc(gameSession.createdAt),
      with: { players: true },
    }),
  ),

  create: protectedProcedure.input(createSessionSchema).mutation(async ({ ctx, input }) => {
    const code = await allocateCode(ctx.db)

    return ctx.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(gameSession)
        .values({ code, name: input.name, hostUserId: ctx.user.id })
        .returning()
      if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

      if (input.teamNames.length > 0) {
        await tx.insert(team).values(
          input.teamNames.map((name, index) => ({
            sessionId: created.id,
            name,
            color: TEAM_COLORS[index % TEAM_COLORS.length] as string,
            position: index,
          })),
        )
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

    const [player] = await ctx.db
      .insert(sessionPlayer)
      .values({
        sessionId: session.id,
        teamId: input.teamId ?? null,
        userId: ctx.user?.id ?? null,
        token: generatePlayerToken(),
        displayName: input.displayName,
      })
      .returning()
    if (!player) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

    await broadcastToSession(session.id, {
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

  setRegistrationOpen: protectedProcedure
    .input(z.object({ sessionId: z.uuid(), open: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(gameSession)
        .set({ registrationOpen: input.open })
        .where(eq(gameSession.id, input.sessionId))
      await broadcastToSession(input.sessionId, { type: 'session_updated' })
    }),

  renamePlayer: protectedProcedure
    .input(z.object({ playerId: z.uuid(), displayName: displayNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(sessionPlayer)
        .set({ displayName: input.displayName })
        .where(eq(sessionPlayer.id, input.playerId))
        .returning()
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' })
      await broadcastToSession(updated.sessionId, { type: 'session_updated' })
    }),

  assignTeam: protectedProcedure
    .input(z.object({ playerId: z.uuid(), teamId: z.uuid().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(sessionPlayer)
        .set({ teamId: input.teamId })
        .where(eq(sessionPlayer.id, input.playerId))
        .returning()
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' })
      await broadcastToSession(updated.sessionId, { type: 'teams_updated' })
    }),

  removePlayer: protectedProcedure
    .input(z.object({ playerId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [removed] = await ctx.db
        .delete(sessionPlayer)
        .where(eq(sessionPlayer.id, input.playerId))
        .returning()
      if (!removed) throw new TRPCError({ code: 'NOT_FOUND' })
      await broadcastToSession(removed.sessionId, {
        type: 'player_left',
        playerId: removed.id,
      })
    }),

  addTeam: protectedProcedure
    .input(z.object({ sessionId: z.uuid(), name: z.string().trim().min(1).max(24) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.team.findMany({
        where: eq(team.sessionId, input.sessionId),
      })
      const [created] = await ctx.db
        .insert(team)
        .values({
          sessionId: input.sessionId,
          name: input.name,
          color: TEAM_COLORS[existing.length % TEAM_COLORS.length] as string,
          position: existing.length,
        })
        .returning()
      await broadcastToSession(input.sessionId, { type: 'teams_updated' })
      return created
    }),

  removeTeam: protectedProcedure
    .input(z.object({ teamId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [removed] = await ctx.db.delete(team).where(eq(team.id, input.teamId)).returning()
      if (!removed) throw new TRPCError({ code: 'NOT_FOUND' })
      await broadcastToSession(removed.sessionId, { type: 'teams_updated' })
    }),

  finish: protectedProcedure
    .input(z.object({ sessionId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(gameSession)
        .set({ status: 'finished', activeMatchId: null })
        .where(and(eq(gameSession.id, input.sessionId), eq(gameSession.hostUserId, ctx.user.id)))
      await broadcastToSession(input.sessionId, { type: 'session_updated' })
    }),
})

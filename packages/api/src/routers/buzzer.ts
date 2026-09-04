import { TRPCError } from '@trpc/server'
import { BUZZER_KEYS } from '@workspace/common/consts'
import { bindableBuzzerKeySchema, buzzerTargetSchema } from '@workspace/common/schemas'
import { and, asc, eq, ne } from '@workspace/db'
import { buzzerBinding, sessionPlayer, team } from '@workspace/db/schema'
import { broadcastToSession } from '@workspace/realtime/server'
import { z } from 'zod'
import { createTRPCRouter, hostProcedure } from '../trpc'

/**
 * Which pad belongs to whom.
 *
 * Host-only, unlike the rest of the session read: a phone has no use for the
 * map, and the TV only ever reports the pad it saw — the server does the
 * resolving. Nothing a player can read tells them which pad is someone else's.
 */
export const buzzerRouter = createTRPCRouter({
  keys: hostProcedure.query(() => BUZZER_KEYS),

  list: hostProcedure.input(z.object({ sessionId: z.uuid() })).query(({ ctx, input }) =>
    ctx.db.query.buzzerBinding.findMany({
      where: eq(buzzerBinding.sessionId, input.sessionId),
      orderBy: asc(buzzerBinding.key),
      with: { player: { columns: { token: false } }, team: true },
    }),
  ),

  bind: hostProcedure
    .input(
      z.object({
        sessionId: z.uuid(),
        key: bindableBuzzerKeySchema,
        target: buzzerTargetSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check the target belongs to this session before binding it, or a pad
      // could be pointed at somebody in a different night entirely.
      if (input.target.kind === 'player') {
        const player = await ctx.db.query.sessionPlayer.findFirst({
          where: and(
            eq(sessionPlayer.id, input.target.playerId),
            eq(sessionPlayer.sessionId, input.sessionId),
          ),
        })
        if (!player) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not in this session' })
      } else {
        const found = await ctx.db.query.team.findFirst({
          where: and(eq(team.id, input.target.teamId), eq(team.sessionId, input.sessionId)),
        })
        if (!found) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not in this session' })
      }

      const values = {
        sessionId: input.sessionId,
        key: input.key,
        kind: input.target.kind,
        playerId: input.target.kind === 'player' ? input.target.playerId : null,
        teamId: input.target.kind === 'team' ? input.target.teamId : null,
      }

      // One pad, one owner — and one owner, one pad. The first is the conflict
      // update: rebinding a pad replaces its owner rather than accumulating.
      // The second is the delete: a player moved onto a new pad has to let go
      // of the old one, or both pads buzz as them and the spare reads as a
      // phantom press. The console only ever shows one pad per person, so the
      // second binding would be invisible as well as wrong.
      const created = ctx.db.transaction((tx) => {
        tx.delete(buzzerBinding)
          .where(
            and(
              eq(buzzerBinding.sessionId, input.sessionId),
              ne(buzzerBinding.key, input.key),
              input.target.kind === 'player'
                ? eq(buzzerBinding.playerId, input.target.playerId)
                : eq(buzzerBinding.teamId, input.target.teamId),
            ),
          )
          .run()

        return tx
          .insert(buzzerBinding)
          .values(values)
          .onConflictDoUpdate({
            target: [buzzerBinding.sessionId, buzzerBinding.key],
            set: { kind: values.kind, playerId: values.playerId, teamId: values.teamId },
          })
          .returning()
          .get()
      })

      broadcastToSession(input.sessionId, { type: 'buzzers_updated' })
      return created
    }),

  unbind: hostProcedure
    .input(z.object({ sessionId: z.uuid(), key: bindableBuzzerKeySchema }))
    .mutation(({ ctx, input }) => {
      ctx.db
        .delete(buzzerBinding)
        .where(and(eq(buzzerBinding.sessionId, input.sessionId), eq(buzzerBinding.key, input.key)))
        .run()
      broadcastToSession(input.sessionId, { type: 'buzzers_updated' })
    }),

  clear: hostProcedure.input(z.object({ sessionId: z.uuid() })).mutation(({ ctx, input }) => {
    ctx.db.delete(buzzerBinding).where(eq(buzzerBinding.sessionId, input.sessionId)).run()
    broadcastToSession(input.sessionId, { type: 'buzzers_updated' })
  }),
})

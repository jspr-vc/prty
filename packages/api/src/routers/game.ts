import { gameSlugSchema } from '@workspace/common/schemas'
import { asc, eq } from '@workspace/db'
import { game, gamePack } from '@workspace/db/schema'
import { createTRPCRouter, publicProcedure } from '../trpc'

/**
 * No query cache anywhere in here any more. The database is a file on the same
 * machine as the server, so a read costs microseconds — the cache that used to
 * sit in front of these existed to save round trips to a hosted postgres, and
 * caching a local read would only be a way to serve a stale board.
 */
export const gameRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(game).where(eq(game.enabled, true)).orderBy(asc(game.name)),
  ),

  bySlug: publicProcedure.input(gameSlugSchema).query(async ({ ctx, input }) => {
    const [found] = await ctx.db.select().from(game).where(eq(game.slug, input)).limit(1)
    return found
  }),

  packs: publicProcedure.input(gameSlugSchema).query(async ({ ctx, input }) => {
    const [found] = await ctx.db
      .select({ id: game.id })
      .from(game)
      .where(eq(game.slug, input))
      .limit(1)
    if (!found) return []

    return ctx.db
      .select()
      .from(gamePack)
      .where(eq(gamePack.gameId, found.id))
      .orderBy(asc(gamePack.name))
  }),
})

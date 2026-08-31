import { gameSlugSchema } from '@workspace/common/schemas'
import { asc, eq } from '@workspace/db'
import { game, gamePack } from '@workspace/db/schema'
import { createTRPCRouter, publicProcedure } from '../trpc'

/**
 * The game registry and its question packs are the only reads here worth
 * caching: they change when you run the seed and effectively never otherwise,
 * and the host console asks for them on every load. Everything about a live
 * session is deliberately left uncached — a stale board would be worse than a
 * slow one.
 */
/**
 * A minute, not longer. The seed runs in its own process, so it cannot
 * invalidate a running server's cache — a long TTL means newly seeded games and
 * packs simply do not appear, which is confusing enough to be worse than the
 * queries it saves.
 */
const STATIC_CONTENT = { config: { ex: 60 } } as const

export const gameRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(game)
      .where(eq(game.enabled, true))
      .orderBy(asc(game.name))
      .$withCache(STATIC_CONTENT),
  ),

  bySlug: publicProcedure.input(gameSlugSchema).query(async ({ ctx, input }) => {
    const [found] = await ctx.db
      .select()
      .from(game)
      .where(eq(game.slug, input))
      .limit(1)
      .$withCache(STATIC_CONTENT)
    return found
  }),

  packs: publicProcedure.input(gameSlugSchema).query(async ({ ctx, input }) => {
    const [found] = await ctx.db
      .select({ id: game.id })
      .from(game)
      .where(eq(game.slug, input))
      .limit(1)
      .$withCache(STATIC_CONTENT)
    if (!found) return []

    return ctx.db
      .select()
      .from(gamePack)
      .where(eq(gamePack.gameId, found.id))
      .orderBy(asc(gamePack.name))
      .$withCache(STATIC_CONTENT)
  }),
})

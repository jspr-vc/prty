import { gameSlugSchema } from '@workspace/common/schemas'
import { asc, eq } from '@workspace/db'
import { game, gamePack } from '@workspace/db/schema'
import { createTRPCRouter, publicProcedure } from '../trpc'

export const gameRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.query.game.findMany({ where: eq(game.enabled, true), orderBy: asc(game.name) }),
  ),

  bySlug: publicProcedure
    .input(gameSlugSchema)
    .query(({ ctx, input }) => ctx.db.query.game.findFirst({ where: eq(game.slug, input) })),

  packs: publicProcedure.input(gameSlugSchema).query(async ({ ctx, input }) => {
    const found = await ctx.db.query.game.findFirst({ where: eq(game.slug, input) })
    if (!found) return []
    return ctx.db.query.gamePack.findMany({
      where: eq(gamePack.gameId, found.id),
      orderBy: asc(gamePack.name),
    })
  }),
})

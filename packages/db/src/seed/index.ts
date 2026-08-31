import '../../load-env'

import { familyFeud, jeopardy } from '@workspace/games'
import { eq } from 'drizzle-orm'
import { db, sql } from '../client'
import { game, gamePack } from '../schema'
import { generalSurveyPack } from './feud-general'
import { devSurveyPack } from './feud-pack'
import { generalTriviaPack } from './jeopardy-general'
import { devTriviaPack } from './jeopardy-pack'

const entries = [
  {
    definition: jeopardy,
    packs: [
      { slug: 'general-trivia', name: 'General Trivia', content: generalTriviaPack },
      { slug: 'dev-trivia', name: 'Dev Trivia', content: devTriviaPack },
    ],
  },
  {
    definition: familyFeud,
    packs: [
      { slug: 'general-surveys', name: 'General Surveys', content: generalSurveyPack },
      { slug: 'dev-surveys', name: 'Dev Surveys', content: devSurveyPack },
    ],
  },
]

async function main() {
  for (const { definition, packs } of entries) {
    const values = {
      slug: definition.slug,
      name: definition.name,
      description: definition.description,
      minPlayers: definition.minPlayers,
      maxPlayers: definition.maxPlayers,
      enabled: true,
    }

    await db.insert(game).values(values).onConflictDoUpdate({ target: game.slug, set: values })
    const row = await db.query.game.findFirst({ where: eq(game.slug, definition.slug) })
    if (!row) throw new Error(`failed to upsert game ${definition.slug}`)

    for (const pack of packs) {
      // Parse before writing so a malformed pack fails here, not mid-match.
      const content = definition.packSchema.parse(pack.content)
      const packValues = { gameId: row.id, slug: pack.slug, name: pack.name, content }
      await db
        .insert(gamePack)
        .values(packValues)
        .onConflictDoUpdate({
          target: [gamePack.gameId, gamePack.slug],
          set: { name: pack.name, content },
        })
    }

    console.log(`seeded ${definition.name} with ${packs.length} pack(s)`)
  }

  await sql.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

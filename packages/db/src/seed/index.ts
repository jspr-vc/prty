import { familyFeud, jeopardy } from '@workspace/games'
import { eq } from 'drizzle-orm'
import type { Database_ } from '../client'
import { game, gamePack } from '../schema'
import { devSurveyPack2 } from './feud-dev-2'
import { devOpsSurveyPack } from './feud-devops'
import { devOpsSurveyPack2 } from './feud-devops-2'
import { generalSurveyPack } from './feud-general'
import { generalSurveyPack2 } from './feud-general-2'
import { devSurveyPack } from './feud-pack'
import { partySurveyPack } from './feud-party'
import { devTriviaPack2 } from './jeopardy-dev-2'
import { devOpsTriviaPack } from './jeopardy-devops'
import { devOpsTriviaPack2 } from './jeopardy-devops-2'
import { generalTriviaPack } from './jeopardy-general'
import { generalTriviaPack2 } from './jeopardy-general-2'
import { devTriviaPack } from './jeopardy-pack'
import { pubQuizPack } from './jeopardy-pubquiz'

const entries = [
  {
    definition: jeopardy,
    packs: [
      { slug: 'general-trivia', name: 'General Trivia', content: generalTriviaPack },
      { slug: 'pub-quiz', name: 'Pub Quiz', content: pubQuizPack },
      { slug: 'general-trivia-2', name: 'General Trivia II', content: generalTriviaPack2 },
      { slug: 'dev-trivia', name: 'Dev Trivia', content: devTriviaPack },
      { slug: 'dev-trivia-2', name: 'Dev Trivia II', content: devTriviaPack2 },
      { slug: 'devops-trivia', name: 'DevOps Trivia', content: devOpsTriviaPack },
      { slug: 'devops-trivia-2', name: 'DevOps Trivia II', content: devOpsTriviaPack2 },
    ],
  },
  {
    definition: familyFeud,
    packs: [
      { slug: 'general-surveys', name: 'General Surveys', content: generalSurveyPack },
      { slug: 'party-surveys', name: 'Party Surveys', content: partySurveyPack },
      { slug: 'general-surveys-2', name: 'General Surveys II', content: generalSurveyPack2 },
      { slug: 'dev-surveys', name: 'Dev Surveys', content: devSurveyPack },
      { slug: 'dev-surveys-2', name: 'Dev Surveys II', content: devSurveyPack2 },
      { slug: 'devops-surveys', name: 'DevOps Surveys', content: devOpsSurveyPack },
      { slug: 'devops-surveys-2', name: 'DevOps Surveys II', content: devOpsSurveyPack2 },
    ],
  },
]

/**
 * Registers the built-in games and their packs. Runs on every boot rather than
 * as a separate command: the binary is handed to someone who is about to start
 * a game, not to someone who is about to read a setup guide.
 *
 * Synchronous throughout — `bun:sqlite` is a synchronous driver, and an `await`
 * inside a transaction callback would let it commit early.
 */
export function seedContent(db: Database_): void {
  for (const { definition, packs } of entries) {
    const values = {
      slug: definition.slug,
      name: definition.name,
      description: definition.description,
      minPlayers: definition.minPlayers,
      maxPlayers: definition.maxPlayers,
      enabled: true,
    }

    db.insert(game).values(values).onConflictDoUpdate({ target: game.slug, set: values }).run()
    const row = db.select().from(game).where(eq(game.slug, definition.slug)).get()
    if (!row) throw new Error(`failed to upsert game ${definition.slug}`)

    for (const pack of packs) {
      // Parse before writing so a malformed pack fails here, not mid-match.
      const content = definition.packSchema.parse(pack.content)
      db.insert(gamePack)
        .values({ gameId: row.id, slug: pack.slug, name: pack.name, content })
        .onConflictDoUpdate({
          target: [gamePack.gameId, gamePack.slug],
          set: { name: pack.name, content },
        })
        .run()
    }
  }
}

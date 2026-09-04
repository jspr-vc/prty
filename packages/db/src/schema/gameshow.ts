import { MATCH_STATUSES, NARRATION_MODES, SESSION_STATUSES } from '@workspace/common/consts'
import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

/**
 * SQLite has no uuid type and no `gen_random_uuid()`, so ids are generated in
 * the process. They stay uuids rather than integers because the join token, the
 * player id and the match id all travel to a phone, and a guessable id is one
 * more thing to think about.
 */
const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())

const updatedAt = () =>
  integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())

/**
 * Process-wide settings that must survive a restart — the host PIN, above all.
 * Regenerating the PIN on every launch would mean re-pairing the console every
 * time the binary is restarted mid-night.
 */
export const appSetting = sqliteTable('app_setting', {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: updatedAt(),
})

export const game = sqliteTable('game', {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  minPlayers: integer().notNull().default(2),
  maxPlayers: integer().notNull().default(12),
  enabled: integer({ mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

/** A reusable set of questions for one game: a Jeopardy board, a run of Feud surveys. */
export const gamePack = sqliteTable(
  'game_pack',
  {
    id: id(),
    gameId: text()
      .notNull()
      .references(() => game.id, { onDelete: 'cascade' }),
    slug: text().notNull(),
    name: text().notNull(),
    content: text({ mode: 'json' }).$type<unknown>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique('game_pack_slug_unique').on(t.gameId, t.slug)],
)

/** A gameshow night: one host, one group of people, many matches. */
export const gameSession = sqliteTable('game_session', {
  id: id(),
  code: text().notNull().unique(),
  name: text().notNull(),
  status: text({ enum: SESSION_STATUSES }).notNull().default('lobby'),
  activeMatchId: text(),
  registrationOpen: integer({ mode: 'boolean' }).notNull().default(true),
  /** How much of the board the big screen reads out loud. */
  narrationMode: text({ enum: NARRATION_MODES }).notNull().default('off'),
  /** Percent of the voice's natural speed. */
  narrationRate: integer().notNull().default(95),
  /** A `speechSynthesis` voice name, or null to take whatever the TV defaults to. */
  narrationVoice: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const team = sqliteTable(
  'team',
  {
    id: id(),
    sessionId: text()
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    color: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [unique('team_name_unique').on(t.sessionId, t.name)],
)

/** A person registered into a session, usually from their phone via the TV's QR code. */
export const sessionPlayer = sqliteTable(
  'session_player',
  {
    id: id(),
    sessionId: text()
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    teamId: text().references(() => team.id, { onDelete: 'set null' }),
    token: text().notNull().unique(),
    displayName: text().notNull(),
    score: integer().notNull().default(0),
    connected: integer({ mode: 'boolean' }).notNull().default(true),
    joinedAt: createdAt(),
  },
  (t) => [
    index('session_player_session_idx').on(t.sessionId),
    unique('session_player_name_unique').on(t.sessionId, t.displayName),
  ],
)

/**
 * One pad of a physical buzzer set, pointed at whoever is sitting behind it.
 *
 * A pad is bound to a player or to a team, never both — the `kind` column says
 * which, and exactly one of the two id columns is set. A team binding is what
 * you want for Family Feud, where a pad belongs to a side of the room rather
 * than to one person.
 */
export const buzzerBinding = sqliteTable(
  'buzzer_binding',
  {
    id: id(),
    sessionId: text()
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    /** A `KeyboardEvent.code`: F13 through F23. */
    key: text().notNull(),
    kind: text({ enum: ['player', 'team'] }).notNull(),
    playerId: text().references(() => sessionPlayer.id, { onDelete: 'cascade' }),
    teamId: text().references(() => team.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [unique('buzzer_binding_key_unique').on(t.sessionId, t.key)],
)

/** One playthrough of one game inside a session. */
export const match = sqliteTable(
  'match',
  {
    id: id(),
    sessionId: text()
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    gameId: text()
      .notNull()
      .references(() => game.id, { onDelete: 'restrict' }),
    packId: text().references(() => gamePack.id, { onDelete: 'set null' }),
    status: text({ enum: MATCH_STATUSES }).notNull().default('pending'),
    state: text({ mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
    /**
     * Bumped by one on every committed action. The broadcast that carries a new
     * state carries its rev too, so a client can drop a message it has already
     * applied or one that overtook a newer one in flight.
     */
    rev: integer().notNull().default(0),
    startedAt: integer({ mode: 'timestamp' }),
    endedAt: integer({ mode: 'timestamp' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('match_session_idx').on(t.sessionId)],
)

/** Append-only log of every action applied to a match. Replayable, auditable. */
export const matchEvent = sqliteTable(
  'match_event',
  {
    id: id(),
    matchId: text()
      .notNull()
      .references(() => match.id, { onDelete: 'cascade' }),
    actorPlayerId: text().references(() => sessionPlayer.id, { onDelete: 'set null' }),
    type: text().notNull(),
    payload: text({ mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index('match_event_match_created_idx').on(t.matchId, t.createdAt)],
)

/**
 * Synthesised speech, kept so the same clue is never rendered twice. The clips
 * are small and the whole database is a file the host can delete, so storing
 * the audio inline beats managing a cache directory beside it.
 */
export const narrationClip = sqliteTable('narration_clip', {
  /** sha256 of engine, voice and text: the same request always finds its clip. */
  id: text().primaryKey(),
  engine: text().notNull(),
  voice: text(),
  text: text().notNull(),
  mimeType: text().notNull(),
  /** base64. SQLite would take a blob, but this row travels out as JSON anyway. */
  audio: text().notNull(),
  createdAt: createdAt(),
})

export const gameRelations = relations(game, ({ many }) => ({
  packs: many(gamePack),
  matches: many(match),
}))

export const gamePackRelations = relations(gamePack, ({ one }) => ({
  game: one(game, { fields: [gamePack.gameId], references: [game.id] }),
}))

export const gameSessionRelations = relations(gameSession, ({ one, many }) => ({
  activeMatch: one(match, { fields: [gameSession.activeMatchId], references: [match.id] }),
  teams: many(team),
  players: many(sessionPlayer),
  matches: many(match),
  buzzers: many(buzzerBinding),
}))

export const teamRelations = relations(team, ({ one, many }) => ({
  session: one(gameSession, { fields: [team.sessionId], references: [gameSession.id] }),
  players: many(sessionPlayer),
}))

export const sessionPlayerRelations = relations(sessionPlayer, ({ one }) => ({
  session: one(gameSession, { fields: [sessionPlayer.sessionId], references: [gameSession.id] }),
  team: one(team, { fields: [sessionPlayer.teamId], references: [team.id] }),
}))

export const buzzerBindingRelations = relations(buzzerBinding, ({ one }) => ({
  session: one(gameSession, { fields: [buzzerBinding.sessionId], references: [gameSession.id] }),
  player: one(sessionPlayer, {
    fields: [buzzerBinding.playerId],
    references: [sessionPlayer.id],
  }),
  team: one(team, { fields: [buzzerBinding.teamId], references: [team.id] }),
}))

export const matchRelations = relations(match, ({ one, many }) => ({
  session: one(gameSession, { fields: [match.sessionId], references: [gameSession.id] }),
  game: one(game, { fields: [match.gameId], references: [game.id] }),
  pack: one(gamePack, { fields: [match.packId], references: [gamePack.id] }),
  events: many(matchEvent),
}))

export const matchEventRelations = relations(matchEvent, ({ one }) => ({
  match: one(match, { fields: [matchEvent.matchId], references: [match.id] }),
  actor: one(sessionPlayer, { fields: [matchEvent.actorPlayerId], references: [sessionPlayer.id] }),
}))

export type Game = typeof game.$inferSelect
export type GamePack = typeof gamePack.$inferSelect
export type GameSession = typeof gameSession.$inferSelect
export type Team = typeof team.$inferSelect
export type SessionPlayer = typeof sessionPlayer.$inferSelect
export type BuzzerBinding = typeof buzzerBinding.$inferSelect
export type Match = typeof match.$inferSelect
export type MatchEvent = typeof matchEvent.$inferSelect
export type NarrationClip = typeof narrationClip.$inferSelect

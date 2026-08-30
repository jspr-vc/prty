import { MATCH_STATUSES, SESSION_STATUSES } from '@workspace/common/consts'
import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

export const sessionStatus = pgEnum('session_status', SESSION_STATUSES)
export const matchStatus = pgEnum('match_status', MATCH_STATUSES)

export const game = pgTable('game', {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  minPlayers: integer().notNull().default(2),
  maxPlayers: integer().notNull().default(12),
  enabled: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/** A reusable set of questions for one game: a Jeopardy board, a run of Feud surveys. */
export const gamePack = pgTable(
  'game_pack',
  {
    id: uuid().primaryKey().defaultRandom(),
    gameId: uuid()
      .notNull()
      .references(() => game.id, { onDelete: 'cascade' }),
    slug: text().notNull(),
    name: text().notNull(),
    content: jsonb().$type<unknown>().notNull(),
    createdByUserId: text().references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('game_pack_slug_unique').on(t.gameId, t.slug)],
)

/** A gameshow night: one host, one group of people, many matches. */
export const gameSession = pgTable(
  'game_session',
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull().unique(),
    name: text().notNull(),
    hostUserId: text().references(() => user.id, { onDelete: 'set null' }),
    organizationId: text(),
    status: sessionStatus().notNull().default('lobby'),
    activeMatchId: uuid(),
    registrationOpen: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('game_session_host_idx').on(t.hostUserId)],
)

export const team = pgTable(
  'team',
  {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid()
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    color: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [unique('team_name_unique').on(t.sessionId, t.name)],
)

/** A person registered into a session, usually from their phone via the TV's QR code. */
export const sessionPlayer = pgTable(
  'session_player',
  {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid()
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    teamId: uuid().references(() => team.id, { onDelete: 'set null' }),
    userId: text().references(() => user.id, { onDelete: 'set null' }),
    token: uuid().notNull().unique(),
    displayName: text().notNull(),
    score: integer().notNull().default(0),
    connected: boolean().notNull().default(true),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('session_player_session_idx').on(t.sessionId),
    unique('session_player_name_unique').on(t.sessionId, t.displayName),
  ],
)

/** One playthrough of one game inside a session. */
export const match = pgTable(
  'match',
  {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid()
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    gameId: uuid()
      .notNull()
      .references(() => game.id, { onDelete: 'restrict' }),
    packId: uuid().references(() => gamePack.id, { onDelete: 'set null' }),
    status: matchStatus().notNull().default('pending'),
    state: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp({ withTimezone: true }),
    endedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('match_session_idx').on(t.sessionId)],
)

/** Append-only log of every action applied to a match. Replayable, auditable. */
export const matchEvent = pgTable(
  'match_event',
  {
    id: uuid().primaryKey().defaultRandom(),
    matchId: uuid()
      .notNull()
      .references(() => match.id, { onDelete: 'cascade' }),
    actorPlayerId: uuid().references(() => sessionPlayer.id, { onDelete: 'set null' }),
    type: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('match_event_match_created_idx').on(t.matchId, t.createdAt)],
)

export const gameRelations = relations(game, ({ many }) => ({
  packs: many(gamePack),
  matches: many(match),
}))

export const gamePackRelations = relations(gamePack, ({ one }) => ({
  game: one(game, { fields: [gamePack.gameId], references: [game.id] }),
}))

export const gameSessionRelations = relations(gameSession, ({ one, many }) => ({
  host: one(user, { fields: [gameSession.hostUserId], references: [user.id] }),
  activeMatch: one(match, { fields: [gameSession.activeMatchId], references: [match.id] }),
  teams: many(team),
  players: many(sessionPlayer),
  matches: many(match),
}))

export const teamRelations = relations(team, ({ one, many }) => ({
  session: one(gameSession, { fields: [team.sessionId], references: [gameSession.id] }),
  players: many(sessionPlayer),
}))

export const sessionPlayerRelations = relations(sessionPlayer, ({ one }) => ({
  session: one(gameSession, { fields: [sessionPlayer.sessionId], references: [gameSession.id] }),
  team: one(team, { fields: [sessionPlayer.teamId], references: [team.id] }),
  user: one(user, { fields: [sessionPlayer.userId], references: [user.id] }),
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
export type Match = typeof match.$inferSelect
export type MatchEvent = typeof matchEvent.$inferSelect

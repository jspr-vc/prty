# Gameshows

Turborepo + bun monorepo for hosting gameshow nights: a big-screen display, a host
console, and one package per game.

## The three surfaces

| Surface           | Where                            | Who touches it                                |
| ----------------- | -------------------------------- | --------------------------------------------- |
| **Big screen**    | `apps/gameclient` (port 3001)    | Nobody. It only renders server state.         |
| **Host console**  | `apps/gamemaster` (port 3000)    | You. Every control lives here.                |
| **Player phones** | `apps/gamemaster` at `/join/:code` | Players, via the QR code on the big screen. |

Phones are not just a sign-up form: once a match is running they become buzzers.
In Jeopardy a player buzzes in and enters their own daily-double wager; in Family
Feud they race for the face-off. The host still judges everything.

The player join flow lives in `gamemaster` because `gameclient` is deliberately
non-interactive; the TV only ever displays.

### Flow

1. Sign in on the console and create a night (a **session**), e.g. "Dev Friends Night".
   You get a four-character code.
2. Open the big screen and enter that code. It shows a QR code pointing at
   `NEXT_PUBLIC_GAMEMASTER_URL/join/<code>`.
3. Everyone scans and registers their own name and team. The TV lobby fills in live.
4. Pick a game and a question pack on the console. The TV switches to the game board.
5. Every control is on the console; the TV and every phone follow over Supabase Realtime.

A session outlives a single game, so one night can run Jeopardy and then Family Feud
with the same people and the same team assignments. Hosting a second night for a
different group is just a second session.

## Layout

| Path                          | What                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `apps/gameclient`             | Big-screen display, read-only                                 |
| `apps/gamemaster`             | Host console + player registration                            |
| `packages/api`                | tRPC router, context, handler, react/server glue              |
| `packages/auth`               | better-auth (organization + admin plugins), access control    |
| `packages/db`                 | drizzle-orm + postgres-js, Upstash redis client, schema, seed |
| `packages/realtime`           | Supabase Realtime broadcast (server) + subscribe hook (client)|
| `packages/ui`                 | shadcn/ui (new-york, neutral), tailwind v4, shared `globals.css` |
| `packages/common`             | consts, zod schemas, utils, the `GameDefinition` contract     |
| `packages/games/*`            | one package per game — see `packages/games/README.md`         |
| `packages/typescript-config`  | shared tsconfig bases                                         |

## Getting started

```bash
cp .env.example .env
bun install
bun run infra:up      # supabase (postgres + realtime + studio) and redis
bun run db:migrate
bun run db:seed       # registers Jeopardy and Family Feud with a starter pack each
bun run dev
```

- Host console: http://localhost:3000
- Big screen: http://localhost:3001
- Supabase Studio: http://127.0.0.1:54333

Ports are shifted off the Supabase defaults (API 54331, db 54332, studio 54333,
redis 6380, redis-http 8089) so this stack can run beside other local projects.

**To play on real phones**, set `NEXT_PUBLIC_GAMEMASTER_URL` to your machine's LAN
address (e.g. `http://192.168.1.6:3000`) so the QR code resolves off-device.

## Deployment

Two Vercel projects, both building from this repo with a Root Directory set:

| Project                | Root directory    | Domain                    |
| ---------------------- | ----------------- | ------------------------- |
| `gameshows-gameclient` | `apps/gameclient` | https://prty.jspr.vc      |
| `gameshows-gamemaster` | `apps/gamemaster` | https://prty-gm.jspr.vc   |

Both are connected to `main`, so a push deploys both. The
`*.vercel.app` URLs keep working alongside the custom domains.

### DNS

`jspr.vc` runs on external nameservers (Namecheap), so both records are added
there. Each subdomain has its own dedicated Vercel target:

| Type    | Host      | Value                                  |
| ------- | --------- | -------------------------------------- |
| `CNAME` | `prty`    | `88129cb626c6bcea.vercel-dns-017.com.` |
| `CNAME` | `prty-gm` | `bab298c54d4a7a1f.vercel-dns-017.com.` |

`cname.vercel-dns.com.` also works for either, but the dedicated targets are
what Vercel recommends. Certificates are issued automatically once the records
resolve.

### Environment variables

Nothing in `.env.example` works in production — those values all point at the
local Supabase and Redis containers. You need a hosted Supabase project and an
Upstash Redis database, then set the following in each Vercel project.

**Both projects** need every server variable, because each one runs its own tRPC
handler and reads the session:

| Variable                        | Where it comes from                                          |
| ------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`                  | Supabase → Connect → **Transaction pooler** (port 6543)        |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API → Project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/publishable key      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API → service_role key (secret) |
| `UPSTASH_REDIS_REST_URL`        | Upstash → your database → REST API                            |
| `UPSTASH_REDIS_REST_TOKEN`      | Upstash → your database → REST API                            |
| `BETTER_AUTH_SECRET`            | Generate one: `openssl rand -base64 32`                       |
| `BETTER_AUTH_URL`               | `https://prty-gm.jspr.vc`                                     |

#### Which connection string

Supabase offers three, and they are not interchangeable:

| String                | Port | Use it for                                              |
| --------------------- | ---- | ------------------------------------------------------- |
| **Transaction pooler**| 6543 | `DATABASE_URL` on Vercel — this is the one the app wants |
| **Session pooler**    | 5432 | `DIRECT_DATABASE_URL`, for migrations and seeds          |
| **Direct**            | 5432 | Same as session pooler, but IPv6-only on the free tier   |

The app runs on serverless functions that come and go, so it needs the
transaction pooler: it hands back the connection after every transaction instead
of holding one per instance. The catch is that a pooled connection is a different
backend each time, so prepared statements cannot survive between queries.
`packages/db/src/client.ts` detects port 6543 and turns them off, along with
capping the client pool at one connection.

Migrations are the opposite: `drizzle-kit` runs DDL and wants a session it can
hold, which the transaction pooler will not give it. Set `DIRECT_DATABASE_URL`
to the session pooler string and drizzle-kit uses it automatically. Direct
connections work too, but Supabase serves them over IPv6 only unless you pay for
the IPv4 add-on, and Vercel's build machines cannot reach them.

`DIRECT_DATABASE_URL` is optional and only needed where migrations run — your
machine, or CI. It falls back to `DATABASE_URL`, which is what local development
uses since there is only one connection string there.

Then the public URLs, which differ per project:

| Variable                      | gameclient | gamemaster | Value                                     |
| ----------------------------- | :--------: | :--------: | ----------------------------------------- |
| `NEXT_PUBLIC_GAMEMASTER_URL`  | ✔          | ✔          | `https://prty-gm.jspr.vc` |
| `NEXT_PUBLIC_GAMECLIENT_URL`  |            | ✔          | `https://prty.jspr.vc`    |

`BETTER_AUTH_URL` points at the gamemaster in both projects: the auth routes only
exist there. `NEXT_PUBLIC_GAMEMASTER_URL` is what the TV encodes into its QR code,
so it must be the address a phone can reach.

### After the variables are set

Run the migration and seed once from your machine, against the **session pooler**
string rather than the transaction one:

```bash
DIRECT_DATABASE_URL='<session pooler url>' bun run db:migrate
DIRECT_DATABASE_URL='<session pooler url>' bun run db:seed
```

Redeploy both projects so the new variables are baked into the client bundles —
`NEXT_PUBLIC_*` values are inlined at build time, so changing them requires a
rebuild, not just a restart.

## Commands

| Command               | What                                     |
| --------------------- | ---------------------------------------- |
| `bun run dev`         | both apps via turbo                      |
| `bun run build`       | build everything                         |
| `bun run typecheck`   | tsc across the workspace                 |
| `bun run format`      | biome check --write                      |
| `bun run db:generate` | generate a drizzle migration             |
| `bun run db:migrate`  | apply migrations                         |
| `bun run db:seed`     | seed games and question packs            |
| `bun run db:studio`   | drizzle studio                           |
| `bun run infra:down`  | stop supabase and redis                  |

`SKIP_ENV_VALIDATION=1` bypasses env validation (used in CI/Docker builds).

## The big screen

One fixed dark palette driven by `--stage-*` tokens, tuned for a mini-LED or OLED panel
in a dark room: a near-black ground rather than a saturated colour, panels separated by a
faint border instead of by brightness, and a foreground that stops short of pure white so
bright text does not bloom. The host console is dark by default for the same reason.

Type and spacing on the big screen are sized in `vw`/`vh`, not rem, via the `.stage-*`
scale. A TV browser may report a 3840px viewport rather than scaling to 1920, and fixed
sizes would then render at half the intended size. The layout is verified at both 1080p
and 4K.

## Sound and motion

The big screen synthesises its cues with the Web Audio API — a buzz-in, a daily-double
fanfare, strikes, reveals, round wins — so there are no audio files in the repo. There is
no in-app volume control: use the TV's.

Browsers refuse to start audio until the page has seen a real gesture, so the first
pointer, key or touch event unlocks it silently. Typing the room code on the big screen
is itself that gesture, so the normal flow needs no extra click. Opening a deep link to
`/s/<code>` on an untouched screen stays silent until someone taps it — browser policy,
not something the app can override.

Because the TV only ever sees state and never the host's clicks, cues are derived by
diffing one render against the next (`cueSignature` / `resolveCue` in `tv-screen.tsx`).
Animation is plain CSS keyframes (`gs-*` in `globals.css`), and every one of them is
switched off under `prefers-reduced-motion`.

## How a game runs

A game is a pure state machine. `packages/games/<slug>` exports a `GameDefinition`
with zod schemas for its question pack, its state and its actions, plus a
`reduce(pack, state, action, ctx)`.

The reducer runs **only on the server**. The host console sends an action to
`match.dispatch`; a player's phone sends one to `match.playerAction`. Either way the
server validates it against the game's own schema, reduces, writes the new state and an
append-only `match_event`, then broadcasts. The console and the TV cannot disagree about
what happened, and every match is replayable from its event log.

Phones authenticate with the join token they were handed at sign-up rather than a
session cookie — nobody signs in to play. A game's `authorizePlayerAction` decides what
a phone may do and stamps the caller's own id onto the action, so a phone cannot buzz in
as somebody else or reach a host-only control. `session.byCode` is public, so it never
returns those tokens.

## Data model

- `game_session` — a night. Has a code, a host, teams and players.
- `team` / `session_player` — who is playing; players register themselves from their phones.
- `game` / `game_pack` — the game registry and reusable question sets.
- `match` — one playthrough of one game inside a session; `state` is the game's own jsonb.
- `match_event` — every action ever applied, in order.

## Notes

- **Realtime authorization.** Broadcast channels are currently public, keyed by an
  unguessable session UUID; the server is the only publisher (service-role key, HTTP
  broadcast). Tightening this means switching to private channels and adding an RLS
  policy on `realtime.messages`, which needs a Supabase-signed JWT minted from the
  better-auth session.
- Redis is served locally through `hiett/serverless-redis-http`, so the same
  `@upstash/redis` client works locally and in production.
- better-auth tables live in the `better_auth` postgres schema. There is no
  `verification` table: with redis secondary storage configured, better-auth keeps
  those records in redis. The field lists come from `getAuthTables(auth.options)`,
  not from the (currently stale) `@better-auth/cli` generator.
- Env lives in a single root `.env`. Each app's `.env` is a symlink to it (created by
  `bun install`), and drizzle-kit loads it via `packages/db/load-env.ts`.

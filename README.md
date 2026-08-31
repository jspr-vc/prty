# Gameshows

Turborepo + bun monorepo for hosting gameshow nights: a big-screen display, a host
console, and one package per game.

## The three surfaces

| Surface           | Where                            | Who touches it                                |
| ----------------- | -------------------------------- | --------------------------------------------- |
| **Big screen**    | `apps/web` at `/` and `/s/:code` | Nobody. It only renders server state.         |
| **Host console**  | `apps/web` at `/host`            | You. Every control lives here.                |
| **Player phones** | `apps/web` at `/join/:code`      | Players, via the QR code on the big screen. |

Phones are not just a sign-up form: once a match is running they become buzzers.
In Jeopardy a player buzzes in and enters their own daily-double wager; in Family
Feud they race for the face-off. The host still judges everything.

All three are one Next.js app, split into route groups with their own layouts.
The join page sits alongside the TV rather than the console so that the QR code
is a same-origin path.

### Flow

1. Sign in on the console and create a night (a **session**), e.g. "Dev Friends Night".
   You get a four-character code.
2. Open the big screen and enter that code. It shows a QR code pointing at
   `/join/<code>` on the same host.
3. Everyone scans and registers their own name and team. The TV lobby fills in live.
4. Pick a game and a question pack on the console. The TV switches to the game board.
5. Every control is on the console; the TV and every phone follow over Supabase Realtime.

A session outlives a single game, so one night can run Jeopardy and then Family Feud
with the same people and the same team assignments. Hosting a second night for a
different group is just a second session.

## Layout

| Path                          | What                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `apps/web`                    | All three surfaces, as route groups with their own layouts    |
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

- Big screen: http://localhost:3000
- Host console: http://localhost:3000/host
- Supabase Studio: http://127.0.0.1:54333

Ports are shifted off the Supabase defaults (API 54331, db 54332, studio 54333,
redis 6380, redis-http 8089) so this stack can run beside other local projects.

**To play on real phones**, open the big screen at your machine's LAN address
(e.g. `http://192.168.1.6:3000`) rather than `localhost`. The QR code is built
from whatever origin the TV is being viewed on, so it will resolve off-device
without any configuration.

## Deployment

One Vercel project, `gameshows-gameclient`, root directory `apps/web`, one
domain — **https://prty.jspr.vc**. Every surface is a path on it:

| Path                 | Surface                                        |
| -------------------- | ---------------------------------------------- |
| `/`, `/s/:code`      | The big screen                                 |
| `/join/:code`        | Player phones, reached by scanning the TV's QR |
| `/host`, `/host/:code` | The host console                             |
| `/sign-in`           | Host sign-in                                   |

Everything is same-origin, which is what keeps the configuration this small:
the QR code is a relative path, the console links to the TV with a relative
path, and there is not a single URL of our own in the environment.

### DNS

`jspr.vc` runs on external nameservers (Namecheap):

| Type    | Host   | Value                                  |
| ------- | ------ | -------------------------------------- |
| `CNAME` | `prty` | `88129cb626c6bcea.vercel-dns-017.com.` |

### Environment variables

One project now, so one set of variables. Nothing in `.env.example` works in
production — those all point at local containers.

| Variable                        | Required | Where it comes from                                          |
| ------------------------------- | :------: | ------------------------------------------------------------ |
| `DATABASE_URL`                  | yes      | Supabase → Connect → **Transaction pooler** (port 6543)       |
| `NEXT_PUBLIC_SUPABASE_URL`      | yes      | Supabase → Settings → API → Project URL                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes      | Supabase → Settings → API → anon key                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | yes      | Supabase → Settings → API → service_role key                  |
| `BETTER_AUTH_SECRET`            | yes      | Generate one: `openssl rand -base64 32`                       |
| `BETTER_AUTH_URL`               | yes      | `https://prty.jspr.vc`                                        |
| `UPSTASH_REDIS_REST_URL`        | no       | Upstash → your database → REST API                            |
| `UPSTASH_REDIS_REST_TOKEN`      | no       | Upstash → your database → REST API                            |

There is not one URL of our own in that list, and no `NEXT_PUBLIC_*` values
either. Everything is same-origin and resolved from the request, so changing the
domain needs no rebuild and cannot leave the QR code pointing somewhere stale.

#### Redis is optional

Leave the two `UPSTASH_*` variables unset and the app runs without redis. Postgres
is always the source of truth: sessions are stored there regardless, and
better-auth falls back to the `verification` table for the records it would
otherwise keep in secondary storage. You lose a session-lookup cache, nothing else.

For query caching there is a small in-process `Map` (`packages/db/src/cache.ts`)
wired into drizzle in **explicit** mode — a query is cached only if it asks, with
`.$withCache()`. Today that is just the game registry and the question packs,
which change when you run the seed and effectively never otherwise. Nothing about
a live session is cached, on purpose: a stale board is worse than a slow one.

Note that this cache is per-process. On serverless each instance keeps its own,
and a mutation only clears the instance that made it, so do not extend it to rows
a host edits mid-show. It is also why the TTL is only a minute: `db:seed` runs in
its own process and cannot clear a running server's cache, so newly seeded packs
would otherwise take five minutes to appear. Restart the app after seeding if you
do not want to wait.

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


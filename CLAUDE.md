# Gameshows

Turborepo + bun monorepo. One Next.js app over shared packages, one package per game.

`apps/web` serves three surfaces as route groups, each with its own root layout:
`(tv)` the big screen, `(player)` the phones, `(console)` the host. In production
one Vercel project answers on both `prty.jspr.vc` (TV + join) and
`prty-gm.jspr.vc` (console).

## Ports

This machine runs other local stacks, so everything here is shifted off the defaults.
Do not move these back to Supabase's standard ports.

| Service            | Port  |
| ------------------ | ----- |
| web                | 3000  |
| Supabase API       | 54331 |
| Postgres           | 54332 |
| Supabase Studio    | 54333 |
| Redis              | 6380  |
| serverless-redis-http | 8089 |

## Rules that are easy to get wrong

- **The join page stays on the TV host.** That is what makes the QR code a
  same-origin path with no URL to configure. Do not move it under `(console)`.
- **No `NEXT_PUBLIC_*` of our own.** Anything the browser needs about another
  host is passed down as a prop from a server component; `NEXT_PUBLIC_` values
  are inlined at build time and silently go stale.
- **Host routing lives in `apps/web/vercel.json`, not middleware.** Next
  middleware runs on the edge runtime and cannot read server env vars — this was
  tried and does not work.
- **The reducer only ever runs on the server**, in `match.dispatch` / `match.playerAction`.
  Clients render state; they never compute it. This is what keeps the TV and the host
  console from disagreeing.
- **A reducer returns its input unchanged to reject an action.** `commit()` checks
  `changed` and skips the write, the event log and the broadcast. Never mutate state.
- **`session.byCode` is public** — the TV and every phone read it with no auth. It must
  never carry join tokens or anything else that authorises an action.
- **Phones authenticate with their join token, not a cookie.** `authorizePlayerAction`
  stamps the caller's own id onto the action; never trust a player id from a payload.
  Player-facing action schemas are deliberately narrower than the host's.
- **`packages/games/registry` must stay free of React** — `packages/api` imports it to
  run reducers server-side. Components are imported by the apps from
  `<game>/display` and `<game>/control`.
- **better-auth's field list comes from `getAuthTables(auth.options)`**, not from
  `@better-auth/cli` (its latest release lags the library and generates a wrong schema).
  There is no `verification` table: redis secondary storage holds those records.
- **`prefetch` in `@workspace/api/server` is awaited.** A fire-and-forget prefetch
  dehydrates a pending query and the page hydrates with a mismatch.

## Env

One root `.env`. Each app's `.env` is a symlink to it, created by `bun install`
(`prepare` → `env:link`). drizzle-kit loads it through `packages/db/load-env.ts`,
because bun and Next only read `.env` from their own working directory.

## Adding a game

See `packages/games/README.md`. In short: implement `GameDefinition`, add the slug to
`GAME_SLUGS`, register it in `packages/games/registry`, map its components in
`apps/web/src/games/registry.tsx`, and seed a pack.

## The big screen ("stage")

- One fixed dark palette, regardless of the viewer's theme: `--stage-*` tokens in
  `globals.css`, exposed as `bg-stage`, `text-stage-accent`, `border-stage-line` and so
  on. Do not hard-code hex in the display components.
- Tuned for mini-LED/OLED in a dark room: near-black ground rather than a saturated
  colour, panels separated by a low border instead of by brightness, foreground short of
  pure white to limit blooming.
- **Never size stage type or spacing in rem/px.** A TV browser can report a 3840px CSS
  viewport, at which point fixed sizes render half as large as intended and the room
  cannot read the board. Use the fluid `.stage-*` classes (`stage-display`, `stage-title`,
  `stage-value`, `stage-score`, `stage-item`, `stage-label`, `stage-caption`, `stage-code`)
  and `vw`/`vh` for padding and widths. A `max-w-*` rem cap has the same bug as fixed
  type — it leaves most of a 4K panel empty.
- The host console defaults to dark (`className="dark"` on its `<html>`) for the same
  reason: it is used in the same dark room.

## Sound and motion

- Cues are synthesised with the Web Audio API in `@workspace/ui/lib/sound` — no audio
  files in the repo. There is no in-app volume control; the room has one.
- Browsers block audio until the page sees a *trusted* gesture. `SoundUnlock` (mounted
  in the `(tv)` and `(player)` layouts) takes the first pointer/key/touch event and resumes the
  context silently. Typing the room code counts, and the client-side navigation to
  `/s/<code>` keeps the same document, so the normal TV flow needs no extra click.
  A deep link straight to `/s/<code>` stays silent until someone touches the screen —
  that is a browser policy, not something the app can work around.
- The TV derives cues by diffing render-to-render state, since it never sees the host's
  clicks. See `cueSignature` / `resolveCue` in `tv-screen.tsx`.
- Animation is plain CSS keyframes in `globals.css` (`gs-*` classes), all disabled under
  `prefers-reduced-motion`. No animation library.

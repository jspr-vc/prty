# Gameshows

Turborepo + bun monorepo. One Bun binary serves everything to one room on one LAN.

`apps/host` is the server and the artifact: `Bun.serve` handling tRPC, the
WebSocket, the TTS endpoint and the client's static assets, compiled with
`bun build --compile` into a single executable. `apps/web` is the client — Vite +
React + TanStack Router — serving three surfaces as routes: `/` and `/s/:code`
the big screen, `/join/:code` the phones, `/host` and `/host/:code` the console.

There is no hosted deployment, no Next.js, no Postgres, no Supabase, no Redis and
no user accounts. Do not reintroduce any of them.

## Ports

This machine runs other local stacks, so development is shifted off the defaults.

| Service                     | Port |
| --------------------------- | ---- |
| Vite dev server (client)    | 3000 |
| Host server in development  | 3001 |
| The binary in production    | 3000 |

Vite proxies `/api` and `/ws` to 3001; the binary serves all of it from one port.

## Rules that are easy to get wrong

- **Everything is same-origin, and no URL of ours lives in the environment.**
  The QR code is built in the browser from `window.location.origin`; the console
  links to the TV with a relative route. Never introduce a build-time URL — those
  are inlined and go stale silently, which is exactly how the QR code used to
  break. The startup banner tells the host to open the TV on a LAN address rather
  than localhost for the same reason.
- **The reducer only ever runs on the server**, in the match service. Clients
  render state; they never compute it. This is what keeps the TV and the host
  console from disagreeing.
- **Every write to a match goes through `withMatchLock`** (`packages/api/src/write-queue.ts`).
  Two buzzes arriving together used to be a real read-modify-write race: both read
  a state with nobody buzzed in, both reduced, and the second write clobbered the
  first. One process now, so the fix is a per-match promise queue. Do not add a
  write path that skips it.
- **`buzzerArmed` is the latch, and it is explicit state.** Never infer "can
  someone buzz" from `buzzedPlayerId` being null. A buzz sets it false; only a new
  question, a wrong answer that reopens the clue, the F24 reset pad, or the host
  sets it true. The reducer rejects a buzz when it is false, which is what makes a
  buzz unstealable.
- **A buzzer press is reported, never resolved, by the client.** The TV and the
  console send the `KeyboardEvent.code` they saw; the server maps it to a player
  through a host-only binding. Bindings never ship to a phone or the TV.
- **`match_updated` carries the reduced state, and clients write it straight into
  the query cache** (`useSessionSync`). Do not turn it back into a bare "something
  changed" ping: refetching cost a second round trip per screen per action, and
  `session.byCode` drags the whole question pack along, so one buzz pulled the
  entire board down onto every device in the room. Every other event still
  invalidates, because it moves rows the push does not carry.
- **A reconnect must re-read.** Pushes are not replayed, so `useSessionChannel`
  fires `onResync` on every reconnection but never the first.
- **`match.rev` orders those pushes.** It is incremented in SQL (`rev = rev + 1`),
  never read-then-written, and a client applies a message only when its rev is
  higher than the one it holds — otherwise a late or duplicated message would roll
  the board backwards. A write returns the same `{ matchId, rev, state, changed }`
  it broadcast, so whoever acted applies their own result instead of waiting for
  it to come back round.
- **A reducer returns its input unchanged to reject an action.** `commit()` checks
  `changed` and skips the write, the event log and the broadcast. Never mutate state.
- **`bun:sqlite` is a synchronous driver, so transactions are synchronous.** Use
  `.run()` / `.get()` / `.all()` inside `db.transaction((tx) => …)` and never
  `await` in the callback — the transaction would commit before the work finished.
- **`session.byCode` is public** — the TV and every phone read it with no auth. It
  must never carry join tokens, buzzer bindings, or anything else that authorises
  an action.
- **Phones authenticate with their join token; the host authenticates with the
  PIN.** `authorizePlayerAction` stamps the caller's own id onto the action; never
  trust a player id from a payload. Player-facing action schemas are deliberately
  narrower than the host's. The PIN is checked per request against the database,
  so rotating it takes effect immediately.
- **`packages/games/registry` must stay free of React** — `packages/api` imports it
  to run reducers server-side. Components are imported by the app from
  `<game>/display` and `<game>/control`.
- **`packages/db/src/migrations.generated.ts`, `apps/host/src/assets.generated.js`,
  `apps/host/src/espeak.generated.js` and `apps/host/src/narration.generated.js`
  are generated, and only the first is committed.** The binary has no folder to
  read migrations, client assets, voice data or pre-rendered clips from, so all
  of it is compiled in. The clips come from `apps/host/narration/clips.db`,
  which the release workflow packs from a piper render; without it the module
  exports null. Run `bun run db:generate` after any schema change; the others
  are rebuilt by `bun run build`, and the
  committed `.d.ts` beside each uncommitted module is what `tsc` reads.
- **The espeak glue is patched as it is copied.** `text2wav` ends its Emscripten
  glue by mounting the real filesystem over `/usr/share`, rooted at its own
  directory. `bun build --compile` resolves that path at build time and bakes it
  in, so the executable would go looking for the build machine's `node_modules`
  and abort anywhere else. `scripts/bundle-espeak.ts` removes the mount and
  `espeak-wasm.ts` writes the same files into the in-memory filesystem from
  embedded assets. Only English is embedded: the full data is eleven megabytes
  of dictionaries for languages there are no packs in.

## Adding a game

See `packages/games/README.md`. In short: implement `GameDefinition`, add the slug
to `GAME_SLUGS`, register it in `packages/games/registry`, map its components in
`apps/web/src/games/registry.tsx`, and seed a pack.

Implementing `narrate` and `buzzerAction` / `buzzerResetAction` is optional. A game
that omits them simply has no narration and ignores physical pads, rather than
erroring.

## The big screen ("stage")

- One fixed dark palette, regardless of the viewer's theme: `--stage-*` tokens in
  `globals.css`, exposed as `bg-stage`, `text-stage-accent`, `border-stage-line`
  and so on. Do not hard-code hex in the display components.
- Tuned for mini-LED/OLED in a dark room: near-black ground rather than a
  saturated colour, panels separated by a low border instead of by brightness,
  foreground short of pure white to limit blooming.
- **Never size stage type or spacing in rem/px.** A TV browser can report a 3840px
  CSS viewport, at which point fixed sizes render half as large as intended and the
  room cannot read the board. Use the fluid `.stage-*` classes (`stage-display`,
  `stage-title`, `stage-value`, `stage-score`, `stage-item`, `stage-label`,
  `stage-caption`, `stage-code`) and `vw`/`vh` for padding and widths. A `max-w-*`
  rem cap has the same bug as fixed type — it leaves most of a 4K panel empty.
- The TV is the one surface that does **not** get the `dark` class; the phone and
  the console do, applied per route by `useSurface`.

## Jeopardy specifics

- **A Daily Double is wagered before it is read.** Selecting one enters the
  `daily_double` phase with the clue still hidden on the big screen; `lock_wager`
  is what reveals it and puts the player on the hook. Showing the clue during the
  wager gives the whole thing away, which is what the phase exists to prevent.

## Sound and motion

- Cues are synthesised with the Web Audio API in `@workspace/ui/lib/sound` — no
  audio files in the repo. There is no in-app volume control; the room has one.
- Narration is separate from cues: `speechSynthesis` on the TV, falling back to the
  server's `/api/tts`, which shells out to a local engine and caches the wav in the
  database. Both are optional and silent when unavailable.
- **Engines are ordered by quality — piper, `say`, `espeak-ng`, `espeak`, and
  finally espeak-ng compiled to WebAssembly and carried inside the binary.** The
  bundled one is always available, so the ladder cannot end in silence on a
  machine with nothing installed; the installed engines still win when present.
  An engine that fails its first render is struck off for the rest of the run
  and the next one down takes over, which is what stops a broken install
  (a piper whose onnxruntime cannot load, say) from costing the room its
  narration and filling the log with one traceback per clue.
- **piper only counts when it has a model, and when it starts.** A piper binary with no `.onnx` in the voices
  directory must not win the selection, or installing piper would replace working
  espeak narration with silence. Piper also takes its text on **stdin**, not argv,
  and its rate flag spelling differs between builds, so it is probed from `--help`
  rather than assumed.
- **Narration is keyed on the line id, and the "arrived mid-round" guard is spent
  the first time a screen sees narration *on*, not on first render.** Narration
  defaults to off, so a guard tied to first render gets spent while off and then
  swallows the first line the host turned it on to hear.
- Browsers block audio until the page sees a *trusted* gesture. `SoundUnlock`
  (mounted on the TV and player routes) takes the first pointer/key/touch event and
  resumes the context silently. Typing the room code counts, and the client-side
  navigation to `/s/<code>` keeps the same document, so the normal TV flow needs no
  extra click. A deep link straight to `/s/<code>` stays silent until someone
  touches the screen — that is a browser policy, not something the app can work
  around.
- The TV derives cues by diffing render-to-render state, since it never sees the
  host's clicks. See `cueSignature` / `resolveCue` in `tv-screen.tsx`. Every field
  in the signature exists because some cue needs it: `lockedOut.length` is how a
  wrong answer is heard (nothing else grows that list), and the count of `false`
  entries in `finalResults` does the same job for Final Jeopardy. Order matters —
  the wrong-answer checks come before the reveal check, because a wrong answer on
  a Daily Double also lands on `revealed`.
- Animation is plain CSS keyframes in `globals.css` (`gs-*` classes), all disabled
  under `prefers-reduced-motion`. No animation library.

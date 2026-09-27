# Gameshows

Gameshows runs a gameshow night from a single executable. The host starts it on a
laptop and everyone else opens a page on the same WiFi. The TV shows the board,
each phone is a buzzer, and the host runs the game from a console page.

```bash
./gameshows
```

```text
────────────────────────────────────────────────────
  Gameshows is live
────────────────────────────────────────────────────
  Big screen   http://localhost:3000
               http://192.168.1.6:3000  (wifi)
  Host console http://localhost:3000/host

  Open the big screen on one of the LAN addresses above, not
  localhost — the QR code is built from whatever address you use.

  Host PIN     418302

  Database     ~/.gameshows/gameshows.db
  Narration    espeak-wasm via built in
  Voices       ~/.gameshows/voices
────────────────────────────────────────────────────
```

It needs no internet connection and no separate database. The binary contains
the client, the server, the schema and the question packs. On first run it
creates a SQLite file and seeds it.

## Running it

You need [Bun](https://bun.sh) 1.4 or newer. Node and a database server are not
needed.

```bash
git clone git@github.com:jspr-vc/prty.git gameshows
cd gameshows
bun install
```

### The binary

Use the binary on the night. Download it from the repo's GitHub releases, or
build it, and copy it to the laptop next to the TV.

A release binary has piper narration built in, so the laptop needs nothing
installed. See [Piper voices built into the binary](#piper-voices-built-into-the-binary).
There are builds for `linux-x64` and `darwin-arm64`. The macOS one is unsigned:
run `xattr -d com.apple.quarantine gameshows-darwin-arm64` once before opening it.

```bash
bun run build:binary   # → bin/gameshows
./bin/gameshows
```

The banner prints the addresses the room can reach it on and the host PIN. The
host console is at `/host`; the big screen is the root URL. Open the big screen
on a LAN address; see [Playing over WiFi](#playing-over-wifi).

### From source

This runs the same server from the checkout without compiling. It builds the client
first, so it takes a moment to start.

```bash
bun run build
bun run start
```

### While developing

```bash
bun run dev
```

Vite serves the client on **3000** with hot reload and proxies `/api` and `/ws`
to the host server on **3001**, which restarts on change. Both listen on the LAN,
so real phones work here too.

### Flags and environment

| Flag           | Env              | Description |
| -------------- | ---------------- | --- |
| `--port`, `-p` | `GAMESHOWS_PORT` | Port to listen on. Default 3000 |
| `--pin`        | `GAMESHOWS_PIN`  | Force the host PIN instead of keeping the stored one |
|                | `GAMESHOWS_DB`   | Where the SQLite file lives. Default `~/.gameshows/gameshows.db` |
|                | `GAMESHOWS_VOICES` | Extra directory to search for piper voices |
|                | `GAMESHOWS_PIPER_BIN` | Path to a piper executable not on `PATH` |
|                | `GAMESHOWS_PIPER_MODEL` | Use this one `.onnx` file as the only piper voice |
|                | `GAMESHOWS_PIPER_CUDA` | `1` passes `--cuda` to piper |
| `--help`, `-h` |                  | Print usage and exit |

The file is created, migrated and seeded on first start. Delete it to reset
everything, including the host PIN.

Two more subcommands, `gameshows voices` and `gameshows narrate`, are covered
under [Narration](#narration).

## The three surfaces

| Surface           | Where           | Who touches it                              |
| ----------------- | --------------- | ------------------------------------------- |
| **Big screen**    | `/`, `/s/:code` | Nobody. It only renders server state.       |
| **Host console**  | `/host`         | The host. Every control is here.            |
| **Player phones** | `/join/:code`   | Players, via the QR code on the big screen. |

All three are one React app served by one Bun process, split by route.

### Flow

1. Run the binary. It prints a host PIN and the addresses the room can reach it on.
2. Open `/host` on your machine and enter the PIN once. That browser is now the host.
3. Create a night (a **session**) and you get a four-character code.
4. Open the big screen on a **LAN address** and enter that code. It shows a QR
   code pointing at `/join/<code>` on the same host.
5. Everyone scans and registers. The TV lobby fills in live.
6. Pick a game and a pack. The TV switches to the board; every control is on the
   console and every screen follows over one WebSocket.

A session spans several games, so one night can run Jeopardy and then Family
Feud with the same people and the same teams.

## Buzzers

Phones are buzzers out of the box. A **physical buzzer set** works too: the
hardware presents itself as a keyboard where each pad sends a function key from
**F13** up, and **F24** is reset.

Plug the box into the machine running the TV or the host console. Both listen
for it. In the console's **Buzzers** panel, pick a player or a team, then press
their pad; whatever key it sent becomes theirs. A pad bound to a team buzzes as
that team's earliest joiner, which is the face-off representative you want in
Family Feud.

### How a buzz is locked in

The first press disarms the buzzers. Both reducers carry an explicit `buzzerArmed`
flag, and a buzz that arrives while it is false is rejected rather than queued,
so a press a millisecond later cannot overwrite the first one.

Only four things re-arm it:

- a new question,
- a wrong answer that reopens the clue (the steal),
- the **F24** reset pad,
- the host's **Re-arm** button, which is the same signal over the WebSocket.

Every write to a match goes through one queue in one process, so the first
press is decided by arrival order at the server. Two presses cannot race through
a read-modify-write window.

## Narration

The big screen can read the board aloud: questions only, or questions and
answers, set per night from the console.

It speaks with the TV browser's own `speechSynthesis` voices when it has any, and
falls back to a speech engine on the server when it does not. The fallback is
common: on Linux, browsers get their voices from speech-dispatcher, which many
machines do not have installed.

Engines are picked in quality order: **piper**, then macOS `say`, then
`espeak-ng`, then `espeak`, and last a copy of espeak-ng compiled to WebAssembly
that ships inside the binary. The last one needs nothing installed, so the
server can always speak. An engine that fails its first render is skipped for
the rest of the run and the next one down takes over. Rendered clips are cached in the database keyed by
engine, voice, rate and text, so a clue is synthesised once and replayed for the
life of the file.

Narration is off by default; turn it on per night from the console.

### Installing piper

[Piper](https://github.com/OHF-Voice/piper1-gpl) is a neural TTS engine that runs
offline on CPU. Its voices are trained on recordings of real speakers, so they
sound far less robotic than espeak's. It needs Python
3.9 or newer. Install it with `pipx` so `piper` stays on `PATH` whichever
virtualenv is active when the server starts:

```bash
pipx install piper-tts
piper --help            # should print usage, not a traceback
```

On Arch, the AUR build installs it as `piper-tts`, which is found too.

Then give it voices. Each one is an `.onnx` model and the `.onnx.json` beside it,
from [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices). These
are the two the packs have been narrated with:

```bash
mkdir -p ~/.gameshows/voices && cd ~/.gameshows/voices
base=https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US
for voice in lessac ryan; do
  for ext in onnx onnx.json; do
    curl -LO "$base/$voice/medium/en_US-$voice-medium.$ext"
  done
done
```

Restart the server and piper takes over from espeak.

Every `.onnx` found becomes a selectable voice, named after its filename. The
search covers `~/.gameshows/voices`, `/usr/share/piper-voices` and
`/usr/local/share/piper-voices` (so distribution-packaged voices are picked up
without copying anything), descending into subdirectories because packaged
voices are filed by language and quality. `GAMESHOWS_VOICES` adds a directory
that wins over all of them; `GAMESHOWS_PIPER_MODEL` pins a single file.

```bash
gameshows voices     # what this machine can speak with, and where it looked
```

If you have a GPU and an ONNX runtime that can use it, `GAMESHOWS_PIPER_CUDA=1`
adds `--cuda`. For pre-rendering, CPU is fast enough.

Piper only counts as available when it has a model to work with, so installing
the binary alone will not silently replace working espeak narration with silence.

### Pre-rendering narration

```bash
gameshows narrate --voice en_US-lessac-medium --rate 95
```

From a checkout, use `./bin/gameshows`, or `bun run --cwd apps/host narrate` and
`voices`.

This walks every pack, renders every line it could ever produce, and stores the
audio in the database. A neural voice takes a moment per line, which is too slow
to do live while the room waits for the next clue. Pack content never changes, so
each line only has to be rendered once.

| Flag | Description |
| --- | --- |
| `--pack <slug>` | Render only this pack. Default is all packs |
| `--voice <name>` | As listed by `gameshows voices` |
| `--rate <n>` | Speaking speed, percent. Default 95 |
| `--mode clues` | Questions only. Default is `everything`, which adds answers |
| `--regenerate` | Render every line again, replacing cached clips |
| `--prune` | Afterwards, delete this voice's clips for lines no pack contains any more |

**Set the same voice and speed on the night.** Clips are cached against engine,
voice, rate and text, so a session at a different speed asks for clips that were
never rendered and falls back to synthesising them live, mid-show.

Re-running is cheap: anything already rendered is skipped, and the summary says
how many were reused. `#` in the progress line is a render, `·` is a cache hit,
`!` is a line the engine refused.

### Piper voices built into the binary

Pushing a `v*` tag runs `.github/workflows/release.yml`. It installs piper,
renders every pack in `en_US-lessac-medium` and `en_US-ryan-medium` at 95%,
converts the clips to MP3 (about 12 MB per voice), embeds them in the binary and
attaches the binaries to a GitHub release. Running the workflow by hand does the
same but only uploads them as build artifacts.

Built-in voices appear in the console's voice list as
`en_US-lessac-medium (built in)`. **Pick one explicitly and leave the speed at
95%.** With no voice chosen, the TV uses its own browser voices and never asks
for the clips. At another speed, the clips don't match and the line is
synthesised live instead. A line re-rendered on the laptop wins over the
built-in one.

To build the same thing locally from clips you've already rendered (needs
ffmpeg):

```bash
bun run --cwd apps/host pack-narration ~/.gameshows/gameshows.db   # → apps/host/narration/clips.db
bun run build:binary                                               # embeds it
```

`apps/host/narration/` is gitignored. Delete it to build without built-in voices.

## Playing over WiFi

Phones always connect over WiFi. These are the network problems that most often
stop a night from starting.

- **Open the big screen on a LAN address, not `localhost`.** The QR code is built
  from whatever address the TV is being viewed on, so `localhost` hands every
  phone a URL only the host machine can resolve.
- **Guest networks usually will not work.** "AP isolation" / "client isolation" is
  on by default on most guest SSIDs and blocks device-to-device traffic,
  so phones cannot reach the host. Use the main network.
- **Everyone on one SSID and one subnet.** A mesh extender or a separate guest
  network can put phones on a different subnet from the host.
- **Check the host machine's firewall** if the host can load the page but phones
  cannot.
- **Phones sleeping is fine.** The socket reconnects on wake and re-reads the
  session, so a phone that locked mid-round catches up rather than going stale.
- **For close calls, prefer the hardware pads.** The server breaks ties by arrival
  order, and a phone's press crosses WiFi first, which adds tens of milliseconds
  of jitter under load. A pad wired into the TV or the host machine skips that hop.

## Development

```bash
bun run dev            # client on 3000, host server on 3001, both hot
bun run build          # client bundle, then embed its assets into the server
bun run build:binary   # → bin/gameshows, a single self-contained executable
bun run typecheck
bun run lint
```

CI runs lint, typecheck and a binary build, then boots the binary and checks it
serves. The same commands run locally, so a green `bun run lint && bun run
typecheck && bun run build:binary` is what a PR needs.

### Layout

| Path                         | What                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| `apps/host`                  | The binary: Bun.serve, WebSocket, tRPC, static assets, TTS     |
| `apps/web`                   | The client: Vite + React + TanStack Router, all three surfaces |
| `packages/api`               | tRPC router, the match service, the per-match write queue      |
| `packages/db`                | drizzle-orm + `bun:sqlite`, schema, migrations, seed           |
| `packages/realtime`          | WebSocket protocol, publisher, subscribe hook                  |
| `packages/ui`                | shadcn/ui (new-york, neutral), tailwind v4, `globals.css`      |
| `packages/common`            | consts, zod schemas, utils, the `GameDefinition` contract      |
| `packages/games/*`           | one package per game, see `packages/games/README.md`           |
| `packages/typescript-config` | shared tsconfig bases                                          |

### The database

One SQLite file, at `~/.gameshows/gameshows.db` unless `GAMESHOWS_DB` says
otherwise. The binary migrates and seeds it on every boot, both idempotent.

Schema changes go through drizzle-kit:

```bash
bun run db:generate   # writes drizzle/*.sql and regenerates migrations.generated.ts
```

That generated module is what makes migrations work inside the binary: there is no
`drizzle/` folder to read at runtime, so the SQL is compiled in. Commit both.

```bash
bun run db:migrate    # apply to the local file without starting the server
bun run db:status     # what is applied, what is pending
bun run db:studio
```

### Moving the database between machines

`data/gameshows.db` is a committed copy of the database, taken without the
narration cache. The cache is almost all of the live file and is re-rendered
on demand. The copy includes the host PIN.

```bash
bun run db:snapshot          # live database → data/gameshows.db
bun run db:restore           # data/gameshows.db → live database, if there is none yet
bun run db:restore --force   # replace an existing one; stop the server first
```

# Games

Each gameshow is its own workspace package. A game is a pure state machine plus the
zod schemas that guard its edges; the server owns the reducer and both apps render
whatever state it produces.

| Package                        | Name                                |
| ------------------------------ | ----------------------------------- |
| `@workspace/game-jeopardy`     | Jeopardy                            |
| `@workspace/game-family-feud`  | Family Feud                         |
| `@workspace/games` (`registry`)| slug → definition lookup, logic only |

## Shape of a game package

```
packages/games/<slug>/
  src/
    content.ts               zod schema for a question pack
    state.ts                 zod schema for match state
    actions.ts               discriminated union of everything the host can do
    reducer.ts               createState + a pure (pack, state, action, ctx) => state
    index.ts                 the GameDefinition object
    components/display.tsx   the TV view
    components/control.tsx   the host view
```

Beyond the reducer, `GameDefinition` has three optional hooks. A game that leaves
them out simply has no narration and ignores physical buzzer pads.

| Hook                 | What it decides                                                |
| -------------------- | -------------------------------------------------------------- |
| `narrate`            | What the big screen should read aloud, as `{ id, text, kind }`  |
| `buzzerAction`       | What a physical pad means for the player it is bound to         |
| `buzzerResetAction`  | What the F24 reset pad means                                    |

`narrate`'s `id` is what stops the TV repeating itself: the line is spoken when the
id changes, so key it on the clue rather than the phase, or buzzing in mid-sentence
restarts the sentence. Return `kind: 'clue'` for the question itself and
`'flavour'` for everything else — the host chooses between the two.

Games that have buzzers must also carry a `buzzerArmed` flag in their state and
reject a buzz while it is false. That flag, not `buzzedPlayerId`, is what makes a
buzz unstealable; see `CLAUDE.md`.

`registry` must stay free of React: `packages/api` imports it to run reducers on the
server. Components are imported directly by the client from `<pkg>/display` and
`<pkg>/control`.

## Adding a game

1. Copy the shape above into `packages/games/<slug>`.
2. Add the slug to `GAME_SLUGS` in `@workspace/common/consts`.
3. Register the definition in `packages/games/registry/src/index.ts`.
4. Map the components in `apps/web/src/games/registry.tsx`.
5. Add a row to the `game` table and a pack (see `packages/db/src/seed/index.ts`).

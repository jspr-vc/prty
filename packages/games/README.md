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
    components/display.tsx   the TV view (gameclient)
    components/control.tsx   the host view (gamemaster)
```

`registry` must stay free of React: `packages/api` imports it to run reducers on the
server. Components are imported directly by the apps from `<pkg>/display` and
`<pkg>/control`.

## Adding a game

1. Copy the shape above into `packages/games/<slug>`.
2. Add the slug to `GAME_SLUGS` in `@workspace/common/consts`.
3. Register the definition in `packages/games/registry/src/index.ts`.
4. Map the components in each app's `src/games/registry.tsx`.
5. Add a row to the `game` table and a pack (see `packages/db/src/seed.ts`).

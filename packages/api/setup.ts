import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { HOST_PIN_HEADER } from '@workspace/common/consts'
import superjson from 'superjson'
import type { AppRouter } from './src/root'

const mk = (pin?: string) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchStreamLink({
        url: 'http://127.0.0.1:3000/api/trpc',
        transformer: superjson,
        headers: () => (pin ? { [HOST_PIN_HEADER]: pin } : {}),
      }),
    ],
  })
const host = mk(process.env.PIN)
const anon = mk()
const s = await host.session.create.mutate({ name: 'Narration Test', teamNames: ['Red', 'Blue'] })
for (const n of ['Ada', 'Bob'])
  await anon.session.join.mutate({ code: s!.code, displayName: n, teamId: null })
const packs = await anon.game.packs.query('jeopardy')
const m = await host.match.create.mutate({
  sessionId: s!.id,
  gameSlug: 'jeopardy',
  packId: packs[0]!.id,
})
console.log(JSON.stringify({ code: s!.code, sessionId: s!.id, matchId: m.id }))

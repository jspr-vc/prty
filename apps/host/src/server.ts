import { pressBuzzer } from '@workspace/api'
import { TRPC_ENDPOINT } from '@workspace/api/config'
import { isHostPin } from '@workspace/api/context'
import { trpcHandler } from '@workspace/api/handler'
import { HOST_PIN_HEADER, type NarrationMode } from '@workspace/common/consts'
import { db, eq } from '@workspace/db'
import { gameSession } from '@workspace/db/schema'
import { type ClientMessage, type ServerMessage, sessionTopic, WS_PATH } from '@workspace/realtime'
import { setPublisher } from '@workspace/realtime/server'
import { hasClientBundle, serveAsset } from './assets'
import { renderStatus, startRender } from './render-job'
import { capabilities, synthesize } from './tts'

interface SocketData {
  sessionId: string
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
}

function send(ws: { send: (data: string) => unknown }, message: ServerMessage): void {
  ws.send(JSON.stringify(message))
}

export interface ServerOptions {
  port: number
  hostname?: string
}

export function startServer({ port, hostname = '0.0.0.0' }: ServerOptions) {
  const server = Bun.serve<SocketData>({
    port,
    hostname,
    // A phone that walks out of range and back should find the socket still
    // there rather than a dead one it has to notice for itself.
    idleTimeout: 120,

    // Annotated because `server` is referenced inside its own initializer;
    // without it TypeScript cannot break the cycle.
    async fetch(req): Promise<Response | undefined> {
      const url = new URL(req.url)

      if (url.pathname === WS_PATH) {
        const sessionId = url.searchParams.get('session')
        if (!sessionId) return new Response('missing session', { status: 400 })

        // Resolve before upgrading: a socket subscribed to a session that does
        // not exist would sit there silently forever.
        const found = db
          .select({ id: gameSession.id })
          .from(gameSession)
          .where(eq(gameSession.id, sessionId))
          .get()
        if (!found) return new Response('no such session', { status: 404 })

        const upgraded = server.upgrade(req, { data: { sessionId: found.id } })
        return upgraded ? undefined : new Response('upgrade failed', { status: 400 })
      }

      if (url.pathname.startsWith(TRPC_ENDPOINT)) return trpcHandler(req)

      if (url.pathname === '/api/tts/capabilities') return json(await capabilities())

      /**
       * Pre-rendering, driven from the console instead of a terminal.
       *
       * Host-only, because it is minutes of CPU and it rewrites the clip cache.
       * The POST starts a job and returns its state rather than waiting for it:
       * a pack on a neural voice takes longer than any sensible request.
       */
      if (url.pathname === '/api/narration/render') {
        if (req.method === 'GET') return json(renderStatus())
        if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
        if (!isHostPin(req.headers.get(HOST_PIN_HEADER))) {
          return new Response('host only', { status: 401 })
        }

        const body = (await req.json().catch(() => ({}))) as {
          pack?: string
          voice?: string | null
          rate?: number
          mode?: NarrationMode
          regenerate?: boolean
        }

        return json(
          startRender({
            pack: body.pack,
            voice: body.voice ?? null,
            rate: Math.max(50, Math.min(150, Math.round(body.rate ?? 95))),
            mode: body.mode === 'clues' ? 'clues' : 'everything',
            regenerate: body.regenerate === true,
          }),
        )
      }

      if (url.pathname === '/api/tts') {
        const text = url.searchParams.get('text')
        if (!text) return new Response('missing text', { status: 400 })

        // Redoing one line is host-only. Everything else here is a read a TV or
        // a phone may make freely, but this one spends the engine and replaces
        // what is stored, which is not a thing the room gets to ask for.
        const regenerate =
          url.searchParams.get('regenerate') === '1' && isHostPin(req.headers.get(HOST_PIN_HEADER))

        const clip = await synthesize(
          text,
          url.searchParams.get('voice'),
          Number(url.searchParams.get('rate') ?? 100),
          regenerate,
        )
        if (!clip) return new Response('no speech engine', { status: 503 })
        return new Response(clip.bytes, {
          headers: {
            'content-type': clip.mimeType,
            // Keyed by the exact text, so the same clue never re-renders. A
            // re-render therefore has to be played from a different URL, which
            // is what the `fresh` flag on a replay is for.
            'cache-control': regenerate ? 'no-store' : 'public, max-age=86400',
          },
        })
      }

      if (url.pathname === '/api/health') {
        return json({ ok: true, client: hasClientBundle() })
      }

      const asset = serveAsset(url.pathname)
      if (asset) return asset

      if (!hasClientBundle()) {
        return new Response(
          'No client bundled. Run `bun run build` from the repo root, or use `bun run dev`.',
          { status: 503, headers: { 'content-type': 'text/plain' } },
        )
      }
      return new Response('Not found', { status: 404 })
    },

    websocket: {
      open(ws) {
        ws.subscribe(sessionTopic(ws.data.sessionId))
        send(ws, { type: 'ready', sessionId: ws.data.sessionId })
      },

      async message(ws, raw) {
        let message: ClientMessage
        try {
          message = JSON.parse(String(raw)) as ClientMessage
        } catch {
          return
        }

        if (message.type === 'ping') {
          send(ws, { type: 'pong' })
          return
        }

        if (message.type === 'buzzer') {
          // Anyone on the socket may report a press. That is the same trust the
          // HTTP route extends, and for the same reason: a pad only ever does
          // what a host-only binding already said it does. The PIN is accepted
          // but not required, so a bridge can identify itself if it wants to.
          void isHostPin(message.pin)
          try {
            await pressBuzzer(db, ws.data.sessionId, message.key)
          } catch (error) {
            send(ws, { type: 'error', message: String(error) })
          }
        }
      },

      close(ws) {
        ws.unsubscribe(sessionTopic(ws.data.sessionId))
      },
    },
  })

  // From here on, anything that commits a state can reach the room.
  setPublisher((topic, payload) => {
    server.publish(topic, payload)
  })

  return server
}

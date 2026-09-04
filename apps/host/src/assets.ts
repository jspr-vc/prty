import { ASSETS } from './assets.generated'

const INDEX = '/index.html'

export function hasClientBundle(): boolean {
  return ASSETS[INDEX] !== undefined
}

/**
 * Serves the built client out of the binary.
 *
 * Everything Vite emits under `/assets/` is content-hashed, so it can be cached
 * hard. `index.html` never can be: it is the file that names the current
 * hashes, and a cached copy points at a build that is no longer there.
 *
 * Anything that is not a file falls through to `index.html`, because the router
 * owns those paths — `/s/ABCD` is a route, not a missing asset.
 */
export function serveAsset(pathname: string): Response | null {
  if (!hasClientBundle()) return null

  const direct = ASSETS[pathname]
  if (direct) {
    const immutable = pathname.startsWith('/assets/')
    return new Response(Bun.file(direct), {
      headers: {
        'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      },
    })
  }

  // A request that looks like a file but is not one is a genuine 404. Handing
  // it index.html instead is how a missing script turns into a blank screen
  // with no error.
  if (/\.[a-z0-9]+$/i.test(pathname)) return null

  const index = ASSETS[INDEX]
  if (!index) return null
  return new Response(Bun.file(index), {
    headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'no-cache' },
  })
}

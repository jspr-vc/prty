import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useParams,
} from '@tanstack/react-router'
import { SESSION_CODE_LENGTH } from '@workspace/common/consts'
import { HostHome } from './routes/host-home'
import { HostSession } from './routes/host-session'
import { JoinRoute } from './routes/join'
import { TvHome } from './routes/tv-home'
import { TvSession } from './routes/tv-session'

const rootRoute = createRootRoute({ component: Outlet, notFoundComponent: NotFound })

/**
 * Codes are typed on a TV remote and read off a QR scan, so they arrive in
 * whatever case the reader felt like. Normalising in one place keeps every
 * screen agreeing on the cache key for `session.byCode`.
 */
export function useSessionCode(): string {
  const { code } = useParams({ strict: false }) as { code?: string }
  return (code ?? '').toUpperCase()
}

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: TvHome }),
  createRoute({ getParentRoute: () => rootRoute, path: '/s/$code', component: TvSession }),
  createRoute({ getParentRoute: () => rootRoute, path: '/join/$code', component: JoinRoute }),
  createRoute({ getParentRoute: () => rootRoute, path: '/host', component: HostHome }),
  createRoute({ getParentRoute: () => rootRoute, path: '/host/$code', component: HostSession }),
]

function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-stage text-stage-fg">
      <p className="stage-title font-bold">Nothing here.</p>
      <a href="/" className="stage-item text-stage-muted underline underline-offset-4">
        Back to the big screen
      </a>
    </main>
  )
}

export const router = createRouter({
  routeTree: rootRoute.addChildren(routes),
  defaultPreload: false,
})

export { SESSION_CODE_LENGTH }

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

import { auth } from '@workspace/auth'
import { db, redis } from '@workspace/db'

export async function createTRPCContext({ headers }: { headers: Headers }) {
  const session = await auth.api.getSession({ headers })

  return {
    db,
    redis,
    headers,
    session,
    user: session?.user ?? null,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

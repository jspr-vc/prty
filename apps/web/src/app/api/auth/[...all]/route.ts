import { auth } from '@workspace/auth'
import { toNextJsHandler } from '@workspace/auth/next'

export const { GET, POST } = toNextJsHandler(auth)

import { adminClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { ac, roles } from './permissions'

export const authClient = createAuthClient({
  plugins: [organizationClient({ ac, roles }), adminClient()],
})

export const { signIn, signUp, signOut, useSession, organization } = authClient

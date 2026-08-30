import './load-env'

import { defineConfig } from 'drizzle-kit'
import { env } from './src/env-db'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: env.DATABASE_URL },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})

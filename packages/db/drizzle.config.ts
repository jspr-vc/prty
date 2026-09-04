import { defineConfig } from 'drizzle-kit'
import { databasePath } from './src/env-db'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: databasePath() },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})

import type { Database } from 'bun:sqlite'
import { generateHostPin } from '@workspace/common/utils'
import { eq } from 'drizzle-orm'
import type { Database_ } from './client'
import { migrateToLatest } from './migrate'
import { appSetting } from './schema'
import { seedContent } from './seed'

const HOST_PIN_KEY = 'host_pin'

export function getSetting(db: Database_, key: string): string | null {
  return db.select().from(appSetting).where(eq(appSetting.key, key)).get()?.value ?? null
}

export function setSetting(db: Database_, key: string, value: string): void {
  db.insert(appSetting)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: new Date() } })
    .run()
}

/**
 * The PIN survives restarts on purpose. Rolling it on every launch would sign
 * the host console out every time the binary is restarted mid-night, which is
 * exactly when nobody wants to go and read the terminal again.
 */
export function ensureHostPin(db: Database_, override?: string): string {
  if (override) {
    setSetting(db, HOST_PIN_KEY, override)
    return override
  }
  const existing = getSetting(db, HOST_PIN_KEY)
  if (existing) return existing
  const pin = generateHostPin()
  setSetting(db, HOST_PIN_KEY, pin)
  return pin
}

export function resetHostPin(db: Database_): string {
  const pin = generateHostPin()
  setSetting(db, HOST_PIN_KEY, pin)
  return pin
}

export interface BootstrapResult {
  applied: string[]
  hostPin: string
}

/** Migrate, seed and pair, in the one order that works from an empty file. */
export function bootstrap(
  sqlite: Database,
  db: Database_,
  options: { pin?: string } = {},
): BootstrapResult {
  const applied = migrateToLatest(sqlite)
  seedContent(db)
  return { applied, hostPin: ensureHostPin(db, options.pin) }
}

import { Cache, type MutationOption } from 'drizzle-orm/cache/core'
import type { CacheConfig } from 'drizzle-orm/cache/core/types'

interface Entry {
  value: unknown[]
  expiresAt: number
  /** Table names (or tags) this result was derived from, for invalidation. */
  keys: string[]
}

const DEFAULT_TTL_SECONDS = 60
const MAX_ENTRIES = 500

/**
 * A query cache that lives in the process, for when redis is not configured.
 *
 * Deliberately `explicit`: only queries that ask for it with `.$withCache()`
 * are cached. Caching everything would be wrong here — a match's state changes
 * several times a minute and the TV must never render a stale board.
 *
 * The important limitation is that this is per-process. On serverless every
 * instance keeps its own copy, and a mutation only invalidates the instance
 * that performed it. That makes it safe for rows that change when you run the
 * seed and effectively never otherwise (the game registry, question packs), and
 * unsafe for anything a host edits mid-show.
 */
export class MemoryCache extends Cache {
  private readonly entries = new Map<string, Entry>()

  strategy(): 'explicit' | 'all' {
    return 'explicit'
  }

  async get(key: string): Promise<unknown[] | undefined> {
    const hit = this.entries.get(key)
    if (!hit) return undefined
    if (hit.expiresAt <= Date.now()) {
      this.entries.delete(key)
      return undefined
    }
    // Refresh insertion order so the eviction below is roughly least-recently-used.
    this.entries.delete(key)
    this.entries.set(key, hit)
    return hit.value
  }

  async put(
    key: string,
    response: unknown,
    tables: string[],
    _isTag: boolean,
    config?: CacheConfig,
  ): Promise<void> {
    const ttl = config?.ex ?? DEFAULT_TTL_SECONDS
    this.entries.set(key, {
      value: response as unknown[],
      expiresAt: Date.now() + ttl * 1000,
      keys: tables,
    })

    // A Map that only grows is a memory leak; drop the oldest when over budget.
    while (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next()
      if (oldest.done) break
      this.entries.delete(oldest.value)
    }
  }

  async onMutate(params: MutationOption): Promise<void> {
    const touched = new Set(
      [params.tables ?? [], params.tags ?? []]
        .flat()
        .map((entry) => (typeof entry === 'string' ? entry : entry._.name)),
    )
    if (touched.size === 0) {
      this.entries.clear()
      return
    }
    for (const [key, entry] of this.entries) {
      if (entry.keys.some((name) => touched.has(name))) this.entries.delete(key)
    }
  }

  /** Test seam: how many live entries are held right now. */
  get size(): number {
    return this.entries.size
  }
}

import type { Database } from 'bun:sqlite'

/**
 * `narration.generated.js` is written by `scripts/bundle-narration.ts` and is
 * not committed; this declaration is, so a checkout typechecks before it builds.
 *
 * The packed piper clips embedded in the binary, or null when the build had
 * none. Bun opens an embedded database in memory, so it is safe to read from.
 */
export declare const NARRATION: Database | null

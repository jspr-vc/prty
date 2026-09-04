/**
 * `espeak.generated.js` is written by `scripts/bundle-espeak.ts` and is not
 * committed; this declaration is, so a checkout typechecks before it builds.
 *
 * The module is Emscripten's factory: hand it an object of overrides and it
 * runs espeak-ng once, against the filesystem the overrides set up.
 */
declare function createEspeak(module: Record<string, unknown>): unknown
export default createEspeak

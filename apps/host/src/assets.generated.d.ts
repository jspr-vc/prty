/**
 * The generated module is JavaScript, not TypeScript, and this is its contract.
 *
 * It has to be JavaScript: it imports each hashed asset with
 * `with { type: 'file' }`, which Bun resolves to a path string it can embed in
 * the binary, and which TypeScript has no way to model — the files are real and
 * resolvable, so a wildcard `declare module '*.css'` never gets a look in.
 * Handing tsc a declaration instead of the import list keeps both honest.
 */
export declare const ASSETS: Record<string, string>

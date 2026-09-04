/**
 * The espeak voice data and the wasm itself, imported with `type: "file"` so
 * `bun build --compile` embeds them and hands back a path inside the
 * executable. They have no extensions TypeScript knows, and no types to find.
 */
declare module 'text2wav/*' {
  const path: string
  export default path
}

import enDict from 'text2wav/espeak-ng-data/en_dict' with { type: 'file' }
import intonations from 'text2wav/espeak-ng-data/intonations' with { type: 'file' }
import langEn from 'text2wav/espeak-ng-data/lang/gmw/en' with { type: 'file' }
import langEnGb from 'text2wav/espeak-ng-data/lang/gmw/en-GB-x-rp' with { type: 'file' }
import langEnUs from 'text2wav/espeak-ng-data/lang/gmw/en-US' with { type: 'file' }
import phondata from 'text2wav/espeak-ng-data/phondata' with { type: 'file' }
import phonindex from 'text2wav/espeak-ng-data/phonindex' with { type: 'file' }
import phontab from 'text2wav/espeak-ng-data/phontab' with { type: 'file' }
import wasm from 'text2wav/lib/espeak-ng.wasm' with { type: 'file' }
import createEspeak from './espeak.generated.js'

/**
 * espeak-ng, compiled to WebAssembly and carried inside the executable.
 *
 * This is the bottom rung of the engine ladder and the reason the ladder can no
 * longer end in silence: piper and the system espeak are better and are still
 * preferred, but they are things a host has to install, and a machine with
 * neither used to have no narration at all.
 *
 * Only English is embedded. The full voice data is eleven megabytes of
 * dictionaries for languages this app has no packs in, against about one and a
 * half for the parts that speak English.
 */

/** Where espeak looks for its data, and what it looks for. `-v` names a lang file. */
const DATA: [string, string][] = [
  ['intonations', intonations],
  ['phondata', phondata],
  ['phonindex', phonindex],
  ['phontab', phontab],
  ['en_dict', enDict],
  ['lang/gmw/en', langEn],
  ['lang/gmw/en-US', langEnUs],
  ['lang/gmw/en-GB-x-rp', langEnGb],
]

/** The voices those lang files provide: what `-v` wants, and what to call it. */
export const ESPEAK_WASM_VOICES = [
  { id: 'en-us', name: 'English (America)' },
  { id: 'en-gb-x-rp', name: 'English (Received Pronunciation)' },
  { id: 'en', name: 'English' },
]

/** The default speaking rate, in words per minute. Matches the espeak binary. */
const BASE_WPM = 175

interface Loaded {
  wasmBinary: ArrayBuffer
  files: [string, Uint8Array][]
}

let loaded: Promise<Loaded> | undefined

/**
 * Read once and kept: embedded assets are read out of the executable, and a
 * show asks for a hundred lines.
 */
function load(): Promise<Loaded> {
  loaded ??= (async () => ({
    wasmBinary: await Bun.file(wasm).arrayBuffer(),
    files: await Promise.all(
      DATA.map(async ([name, path]) => {
        const bytes = new Uint8Array(await Bun.file(path).arrayBuffer())
        return [name, bytes] as [string, Uint8Array]
      }),
    ),
  }))()
  return loaded
}

interface EspeakModule {
  FS: {
    mkdirTree(path: string): void
    writeFile(path: string, data: Uint8Array): void
    readFile(path: string): Uint8Array
  }
}

/** Renders a line to wav bytes, entirely in this process. */
export async function synthesizeWithWasm(
  text: string,
  voice: string | null,
  rate: number,
): Promise<Uint8Array> {
  const { wasmBinary, files } = await load()
  const output = 'out.wav'

  return new Promise<Uint8Array>((resolve, reject) => {
    const module: Record<string, unknown> = {
      // Handed the bytes directly, so the module never goes looking for a
      // `.wasm` beside itself — there is no beside itself in an executable.
      wasmBinary,
      arguments: [
        text,
        '-w',
        output,
        '-v',
        voice && ESPEAK_WASM_VOICES.some((known) => known.id === voice) ? voice : 'en-us',
        '-s',
        String(Math.round((BASE_WPM * rate) / 100)),
      ],
      // Emscripten narrates its own startup on stdout otherwise, in the middle
      // of the server's banner.
      print: () => {},
      printErr: () => {},
      preRun: [
        () => {
          const { FS } = module as unknown as EspeakModule
          FS.mkdirTree('/usr/share/espeak-ng-data/lang/gmw')
          for (const [name, bytes] of files) {
            FS.writeFile(`/usr/share/espeak-ng-data/${name}`, bytes)
          }
        },
      ],
      postRun: () => {
        const { FS } = module as unknown as EspeakModule
        try {
          resolve(FS.readFile(output))
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      },
      onAbort: (reason: unknown) => reject(new Error(`espeak-wasm aborted: ${String(reason)}`)),
    }

    createEspeak(module)
  })
}

import { HOST_PIN_LENGTH, SESSION_CODE_ALPHABET, SESSION_CODE_LENGTH } from './consts'

function randomFrom(alphabet: string, length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length]
  }
  return out
}

export function generateSessionCode(length: number = SESSION_CODE_LENGTH): string {
  return randomFrom(SESSION_CODE_ALPHABET, length)
}

export function generatePlayerToken(): string {
  return crypto.randomUUID()
}

/** Digits only: the host types this on a phone or a TV remote, not a keyboard. */
export function generateHostPin(): string {
  return randomFrom('0123456789', HOST_PIN_LENGTH)
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j] as T, result[i] as T]
  }
  return result
}

export function formatScore(score: number): string {
  const sign = score < 0 ? '-' : ''
  return `${sign}$${Math.abs(score).toLocaleString('en-US')}`
}

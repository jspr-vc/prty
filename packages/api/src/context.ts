import { HOST_PIN_HEADER } from '@workspace/common/consts'
import { db } from '@workspace/db'
import { getSetting } from '@workspace/db/bootstrap'

/**
 * There is no login. The binary prints a PIN, the host console sends it as a
 * header on every call, and that is the whole of the authorisation model.
 *
 * The PIN is read from the database per request rather than captured at
 * startup, so resetting it takes effect on the next call instead of the next
 * restart.
 */
export function isHostPin(pin: string | null | undefined): boolean {
  if (!pin) return false
  const expected = getSetting(db, 'host_pin')
  if (!expected || expected.length !== pin.length) return false
  // Constant time over the digits. The PIN is short and the network is a LAN,
  // but there is no reason to leak a prefix match.
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ pin.charCodeAt(i)
  return diff === 0
}

export function createTRPCContext({ headers }: { headers: Headers }) {
  return {
    db,
    headers,
    isHost: isHostPin(headers.get(HOST_PIN_HEADER)),
  }
}

export type TRPCContext = ReturnType<typeof createTRPCContext>

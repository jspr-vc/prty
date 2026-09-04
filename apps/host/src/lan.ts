import { networkInterfaces } from 'node:os'

export interface LanAddress {
  address: string
  /** The interface it belongs to, so the host can tell WiFi from ethernet. */
  device: string
  wireless: boolean
}

/**
 * Docker bridges, VM taps and VPN tunnels are never the address the room wants.
 *
 * A heuristic, and knowingly an incomplete one — VPN clients name their
 * interfaces whatever they like. Anything that slips through is still printed,
 * labelled with its interface, so the host can see it is not their WiFi rather
 * than being handed a silently wrong number.
 */
const VIRTUAL =
  /^(docker|br-|veth|virbr|vmnet|tun|tap|utun|zt|tailscale)|(^|[-_])(wg|wireguard|nordlynx|proton|mullvad|ipsec|ppp)([-_]|\d|$)/i
const WIRELESS = /^(wl|wlan|wifi|en0$|ath|ra)/i

/**
 * Every address the room can actually reach this box on.
 *
 * The banner prints these because "listening on 0.0.0.0" is useless to someone
 * holding a TV remote: they need the number to type. Loopback is filtered out
 * for the same reason — a phone cannot reach it — and so are virtual
 * interfaces, which are reachable only from this machine and would send the
 * host chasing an address nothing else on the network can see.
 *
 * Wireless first: the phones are on WiFi by definition, so if the host box has
 * both, the WiFi address is the one that will work for everyone.
 */
export function lanAddresses(): LanAddress[] {
  const found: LanAddress[] = []

  for (const [device, entries] of Object.entries(networkInterfaces())) {
    if (VIRTUAL.test(device)) continue
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) continue
      found.push({ address: entry.address, device, wireless: WIRELESS.test(device) })
    }
  }

  return found.sort((a, b) => Number(b.wireless) - Number(a.wireless))
}

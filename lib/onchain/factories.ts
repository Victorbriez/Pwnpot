// Factories des trois épreuves de lancement (docs/CHALLENGES.md).
// `address` reste à `null` tant qu'elles ne sont pas déployées sur Base Sepolia.
import type { Address } from "viem"

import type { Vuln } from "@/lib/mock/explore"

export type KnownFactory = {
  id: string
  name: string
  vuln: Vuln
  address: Address | null
}

export const knownFactories: KnownFactory[] = [
  { id: "vault", name: "Coffre", vuln: "reentrancy", address: null },
  { id: "impostor", name: "Usurpateur", vuln: "tx-origin", address: null },
  {
    id: "code-safe",
    name: "Coffre-fort à code",
    vuln: "storage",
    address: null,
  },
]

/**
 * Adresse à envoyer pour une factory connue. En démo, une factory pas encore
 * déployée reçoit une adresse fictive propre à elle (0x…01, 0x…02, …).
 */
export function knownFactoryAddress(factory: KnownFactory): Address {
  if (factory.address) return factory.address
  const index = knownFactories.indexOf(factory) + 1
  return `0x${index.toString(16).padStart(40, "0")}`
}

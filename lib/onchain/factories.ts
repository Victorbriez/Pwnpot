// Factories des trois épreuves de lancement (docs/CHALLENGES.md).
// `address` reste à `null` tant qu'elles ne sont pas déployées sur Base Sepolia.
import { isAddress, type Address } from "viem"

import { type Vuln } from "@/lib/ctf/types"

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

/**
 * Factory de test (`TestLevel`, contracts/contracts/mocks/) : l'épreuve se
 * résout sans exploit. Renseignée par `pnpm chain:deploy` en local.
 */
export const testFactoryAddress: Address | undefined =
  process.env.NEXT_PUBLIC_TEST_FACTORY_ADDRESS &&
  isAddress(process.env.NEXT_PUBLIC_TEST_FACTORY_ADDRESS)
    ? process.env.NEXT_PUBLIC_TEST_FACTORY_ADDRESS
    : undefined

/** Ce que le front sait d'une factory à partir de son adresse. */
export type FactoryInfo = { name: string; vuln?: Vuln; known: boolean }

export function describeFactory(address: Address): FactoryInfo {
  const lower = address.toLowerCase()
  const known = knownFactories.find((f) => f.address?.toLowerCase() === lower)
  if (known) return { name: known.name, vuln: known.vuln, known: true }
  if (testFactoryAddress?.toLowerCase() === lower)
    return { name: "Factory de test", known: true }
  return { name: "Épreuve personnalisée", known: false }
}

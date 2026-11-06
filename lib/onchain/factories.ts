// Factories des trois épreuves de lancement (docs/CHALLENGES.md).
//
// - Usurpateur et Coffre-fort à code : une factory partagée par tous les CTF,
//   déployée avec la plateforme. Adresse lue dans l'environnement ; `null`
//   tant qu'elle n'est pas déployée.
// - Coffre : une factory par CTF. L'organisateur la déploie et l'alimente
//   depuis le formulaire de création, puis la lie à son CTF (`bind`). Le
//   front la reconnaît à son code (hooks/use-vault-factories.ts).
import { isAddress, parseEther, type Address } from "viem"

import type { FactoryInfo, KnownFactoryId, Vuln } from "@/lib/ctf/types"

export type { FactoryInfo }

export type KnownFactory = {
  id: KnownFactoryId
  name: string
  vuln: Vuln
  /** Adresse partagée par tous les CTF ; toujours `null` pour le Coffre. */
  address: Address | null
  /** Déployée par l'organisateur pour chaque CTF (le Coffre). */
  perCtf?: boolean
  /** Ce que le joueur doit obtenir sur son instance. */
  goal: string
}

function envAddress(value: string | undefined): Address | null {
  return value && isAddress(value) ? value : null
}

/** Ce que l'organisateur dépose par joueur dans son Coffre (`SEED`). */
export const VAULT_SEED = parseEther("0.0001")

export const knownFactories: KnownFactory[] = [
  {
    id: "vault",
    name: "Coffre",
    vuln: "reentrancy",
    address: null,
    perCtf: true,
    goal: "Vide ton coffre : son solde doit tomber à 0.",
  },
  {
    id: "impostor",
    name: "Usurpateur",
    vuln: "tx-origin",
    // Accès direct à process.env : Next ne remplace que cette forme au build.
    address: envAddress(process.env.NEXT_PUBLIC_IMPOSTOR_FACTORY_ADDRESS),
    goal: "Deviens owner de ton instance.",
  },
  {
    id: "code-safe",
    name: "Coffre-fort à code",
    vuln: "storage",
    address: envAddress(process.env.NEXT_PUBLIC_CODE_SAFE_FACTORY_ADDRESS),
    goal: "Déverrouille ton coffre-fort : locked doit passer à false.",
  },
]

export function knownFactoryById(id: KnownFactoryId): KnownFactory {
  return knownFactories.find((f) => f.id === id)!
}

/** Une épreuve est proposée hors démo si elle a une adresse ou se déploie par CTF. */
export function isFactoryAvailable(factory: KnownFactory) {
  return factory.perCtf === true || factory.address !== null
}

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
  envAddress(process.env.NEXT_PUBLIC_TEST_FACTORY_ADDRESS) ?? undefined

/**
 * Ce que le front sait d'une factory. `vaults` contient (en minuscules) les
 * adresses dont le code est celui de VaultFactory.
 */
export function describeFactory(
  address: Address,
  vaults?: ReadonlySet<string>
): FactoryInfo {
  const lower = address.toLowerCase()
  const known = knownFactories.find((f) => f.address?.toLowerCase() === lower)
  if (known)
    return { id: known.id, name: known.name, vuln: known.vuln, known: true }
  if (vaults?.has(lower)) {
    const vault = knownFactoryById("vault")
    return {
      id: vault.id,
      name: vault.name,
      vuln: vault.vuln,
      known: true,
      matchedByCode: true,
    }
  }
  if (testFactoryAddress?.toLowerCase() === lower)
    return { name: "Factory de test", known: true }
  return { name: "Épreuve personnalisée", known: false }
}

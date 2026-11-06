// Vérification du code d'une factory via Sourcify (API publique, sans clé,
// CORS ouvert). `pnpm contracts:deploy` y publie aussi le code, en plus de
// Basescan. Doc : https://sourcify.dev/server/api-docs/
import { type Address } from "viem"
import { baseSepolia } from "viem/chains"

const SOURCIFY_API = "https://sourcify.dev/server/v2/contract"

export type FactoryVerification =
  /** Code source publié et identique au bytecode déployé. */
  | { status: "verified"; name: string | null }
  /** Aucun code source publié pour cette adresse. */
  | { status: "unverified" }
  /** Proxy : le code exécuté peut changer après la création du CTF. */
  | { status: "proxy"; verified: boolean }

type SourcifyContract = {
  match: "exact_match" | "match" | null
  compilation?: { name?: string }
  proxyResolution?: { isProxy?: boolean }
}

export async function fetchFactoryVerification(
  address: Address,
  signal?: AbortSignal
): Promise<FactoryVerification> {
  const url = `${SOURCIFY_API}/${baseSepolia.id}/${address}?fields=compilation.name,proxyResolution`
  const res = await fetch(url, { signal })
  // 404 = adresse inconnue de Sourcify, donc code non publié.
  if (res.status === 404) return { status: "unverified" }
  if (!res.ok) throw new Error(`Sourcify a répondu ${res.status}`)

  const data = (await res.json()) as SourcifyContract
  const verified = data.match === "exact_match" || data.match === "match"
  if (data.proxyResolution?.isProxy) return { status: "proxy", verified }
  if (!verified) return { status: "unverified" }
  return { status: "verified", name: data.compilation?.name ?? null }
}

/**
 * Faux sur le nœud local : il a le même chain id que Base Sepolia, mais ses
 * adresses n'ont rien à voir avec celles que Sourcify connaît.
 */
export const canCheckVerification = !/localhost|127\.0\.0\.1/.test(
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? ""
)

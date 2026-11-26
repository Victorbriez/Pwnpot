"use client"

import { useEffect } from "react"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { type Address } from "viem"

import {
  canCheckVerification,
  fetchFactoryVerification,
  verifyVaultOnSourcify,
} from "@/lib/onchain/sourcify"

function verificationQuery(address: Address | undefined) {
  return {
    queryKey: ["factory-verification", address?.toLowerCase()],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      fetchFactoryVerification(address!, signal),
    enabled: canCheckVerification && address !== undefined,
    // Le code d'une adresse ne change pas (hors proxy, signalé à part).
    staleTime: 30 * 60_000,
    retry: 1,
  }
}

/** État de vérification du code d'une factory (Sourcify). */
export function useFactoryVerification(address: Address | undefined) {
  return useQuery(verificationQuery(address))
}

/**
 * Épreuves dont le code n'est pas vérifié (ou est un proxy, donc modifiable),
 * pour avertir avant l'achat du ticket. Mêmes requêtes que les badges : rien
 * n'est relu. Un Coffre reconnu à son code (`matchedByCode`) compte comme sûr,
 * et une épreuve dont Sourcify ne répond pas n'est pas signalée (le badge
 * l'affiche déjà).
 */
export function useUnverifiedLevels(
  levels: { name: string; factory?: Address; matchedByCode?: boolean }[]
): string[] {
  const checked = levels.filter(
    (level) => level.factory !== undefined && !level.matchedByCode
  )
  const results = useQueries({
    queries: checked.map((level) => verificationQuery(level.factory)),
  })
  return checked
    .filter((_, i) => {
      const status = results[i]?.data?.status
      return status === "unverified" || status === "proxy"
    })
    .map((level) => level.name)
}

/** Coffres déjà envoyés à Sourcify depuis cet onglet : une seule demande chacun. */
const requested = new Set<string>()

/**
 * État Sourcify d'un Coffre (VaultFactory déployée par l'organisateur). S'il
 * n'est pas encore vérifié, la première visite l'envoie à Sourcify, qui
 * recompile et compare au code on-chain (docs/CHALLENGES.md § Ce qu'un joueur
 * doit vérifier). Les Coffres créés depuis le formulaire le sont déjà.
 */
export function useVaultVerification(vault: Address | undefined) {
  const queryClient = useQueryClient()
  const status = useFactoryVerification(vault)
  const { mutate, isPending } = useMutation({
    mutationFn: (address: Address) => verifyVaultOnSourcify(address),
    onSettled: (_data, _error, address) =>
      queryClient.invalidateQueries({
        queryKey: ["factory-verification", address.toLowerCase()],
      }),
  })
  const unverified = status.data?.status === "unverified"

  useEffect(() => {
    if (!vault || !unverified) return
    const key = vault.toLowerCase()
    if (requested.has(key)) return
    requested.add(key)
    mutate(vault)
  }, [vault, unverified, mutate])

  return {
    verified: status.data?.status === "verified",
    verifying: isPending,
  }
}

/** À appeler quand le formulaire vient de vérifier un Coffre : pas de seconde demande. */
export function markVaultRequested(vault: Address) {
  requested.add(vault.toLowerCase())
}

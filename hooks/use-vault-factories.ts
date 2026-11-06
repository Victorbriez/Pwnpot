"use client"

import { useQueries } from "@tanstack/react-query"
import type { Address } from "viem"
import { baseSepolia } from "viem/chains"
import { usePublicClient } from "wagmi"

import { REFRESH_MS } from "@/hooks/use-chain-now"
import { ctfPlatformAddress } from "@/lib/onchain/ctf-platform"
import { vaultFactoryAbi } from "@/lib/onchain/level-artifacts"
import { isVaultFactoryCode } from "@/lib/onchain/vault"

/**
 * Parmi `addresses`, celles qui sont des VaultFactory rattachées à notre
 * CTFPlatform. Renvoie un ensemble d'adresses en minuscules. Le code d'une
 * adresse ne change pas : chaque réponse est gardée pour la session.
 */
export function useVaultMatches(addresses: readonly Address[]) {
  const client = usePublicClient({ chainId: baseSepolia.id })
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]

  const results = useQueries({
    queries: unique.map((address) => ({
      queryKey: ["vault-factory-match", address],
      enabled: !!client && ctfPlatformAddress !== undefined,
      staleTime: Infinity,
      gcTime: Infinity,
      queryFn: async () => {
        const code = await client!.getCode({ address: address as Address })
        if (!isVaultFactoryCode(code)) return false
        // Un Coffre déployé pour une autre plateforme ne compte pas.
        const platform = await client!.readContract({
          address: address as Address,
          abi: vaultFactoryAbi,
          functionName: "platform",
        })
        return platform.toLowerCase() === ctfPlatformAddress!.toLowerCase()
      },
    })),
  })

  const matches = new Set(unique.filter((_, i) => results[i]?.data === true))
  const isLoading = results.some((r) => r.isPending && r.fetchStatus !== "idle")
  return { matches, isLoading }
}

/** État d'un Coffre, pour l'organisateur et pour prévenir les joueurs. */
export type VaultState = {
  factory: Address
  organizer: Address
  bound: boolean
  /** CTF lié, valable si `bound`. */
  ctfId: bigint
  balance: bigint
}

/** Lit l'état de chaque VaultFactory de la liste. */
export function useVaultStates(factories: readonly Address[]) {
  const client = usePublicClient({ chainId: baseSepolia.id })

  const results = useQueries({
    queries: factories.map((factory) => ({
      queryKey: ["vault-factory-state", factory.toLowerCase()],
      enabled: !!client,
      refetchInterval: REFRESH_MS,
      queryFn: async (): Promise<VaultState> => {
        const read = <F extends "organizer" | "bound" | "ctfId">(
          functionName: F
        ) =>
          client!.readContract({
            address: factory,
            abi: vaultFactoryAbi,
            functionName,
          })
        const [organizer, bound, ctfId, balance] = await Promise.all([
          read("organizer"),
          read("bound"),
          read("ctfId"),
          client!.getBalance({ address: factory }),
        ])
        return { factory, organizer, bound, ctfId, balance }
      },
    })),
  })

  return results.flatMap((r) => (r.data ? [r.data] : []))
}

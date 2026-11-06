"use client"

import { baseSepolia } from "viem/chains"
import { useReadContract, useReadContracts } from "wagmi"

import { REFRESH_MS, useChainNow } from "@/hooks/use-chain-now"
import { useVaultMatches } from "@/hooks/use-vault-factories"
import type { Ctf } from "@/lib/ctf/types"
import { ctfs as demoCtfs } from "@/lib/mock/explore"
import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"
import { describeFactory } from "@/lib/onchain/factories"
import { toCtf, type ChainCtf, type ChainLevel } from "@/lib/onchain/mappers"

export type CtfsState = {
  ctfs: Ctf[]
  isLoading: boolean
  error?: Error
  /** Vrai tant que CTFPlatform n'est pas déployé : données fictives. */
  isDemo: boolean
}

const platform = {
  address: ctfPlatformAddress,
  abi: ctfPlatformAbi,
  chainId: baseSepolia.id,
} as const

const enabled = ctfPlatformAddress !== undefined

/** Tous les CTF : lus dans le contrat, ou les mocks en démo. */
export function useCtfs(): CtfsState {
  const now = useChainNow()

  const count = useReadContract({
    ...platform,
    functionName: "ctfCount",
    query: { enabled, refetchInterval: REFRESH_MS },
  })
  const period = useReadContract({
    ...platform,
    functionName: "contestationPeriod",
    query: { enabled },
  })

  const ids = Array.from({ length: Number(count.data ?? BigInt(0)) }, (_, i) =>
    BigInt(i)
  )
  const reads = useReadContracts({
    contracts: ids.flatMap((id) => [
      { ...platform, functionName: "getCTF", args: [id] } as const,
      { ...platform, functionName: "getLevels", args: [id] } as const,
    ]),
    allowFailure: false,
    query: { enabled: enabled && ids.length > 0, refetchInterval: REFRESH_MS },
  })

  // Les factories inconnues par leur adresse peuvent être des Coffres,
  // déployés par chaque organisateur : on compare leur code.
  const data = ids.length > 0 ? (reads.data ?? []) : []
  const unknown = data
    .filter((_, i) => i % 2 === 1)
    .flatMap((levels) =>
      (levels as readonly ChainLevel[]).map((l) => l.factory)
    )
    .filter((factory) => !describeFactory(factory).known)
  const vaults = useVaultMatches(unknown)

  if (!enabled) return { ctfs: demoCtfs, isLoading: false, isDemo: true }

  const error = count.error ?? period.error ?? reads.error ?? undefined
  const loading =
    count.isPending ||
    period.isPending ||
    (ids.length > 0 && reads.isPending) ||
    vaults.isLoading
  if (loading || error || period.data === undefined)
    return { ctfs: [], isLoading: loading, error, isDemo: false }

  const ctfs = ids.flatMap((id, i) => {
    const ctf = data[i * 2] as ChainCtf | undefined
    const levels = data[i * 2 + 1] as readonly ChainLevel[] | undefined
    if (!ctf || !levels) return []
    return [
      toCtf(Number(id), ctf, levels, {
        now,
        contestationPeriod: Number(period.data),
        vaults: vaults.matches,
      }),
    ]
  })

  return { ctfs, isLoading: false, isDemo: false }
}

/** Un CTF par son numéro. `ctf` est `undefined` s'il n'existe pas. */
export function useCtf(id: number): Omit<CtfsState, "ctfs"> & { ctf?: Ctf } {
  const { ctfs, ...state } = useCtfs()
  return { ...state, ctf: ctfs.find((ctf) => ctf.id === id) }
}

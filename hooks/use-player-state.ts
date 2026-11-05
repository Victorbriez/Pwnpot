"use client"

import { zeroAddress, type Address } from "viem"
import { baseSepolia } from "viem/chains"
import { useConnection, useReadContract, useReadContracts } from "wagmi"

import { REFRESH_MS } from "@/hooks/use-chain-now"
import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

const platform = {
  address: ctfPlatformAddress,
  abi: ctfPlatformAbi,
  chainId: baseSepolia.id,
} as const

export type PlayerState = {
  /** Adresse connectée, `undefined` sans wallet. */
  address?: Address
  hasTicket: boolean
  refunded: boolean
  score: number
  /** Instance par épreuve (index = levelIndex), `undefined` si pas créée. */
  instances: (Address | undefined)[]
  solved: boolean[]
  /** Top 3 du contrat, places vides retirées. */
  podium: Address[]
  isLoading: boolean
}

/** Solde retirable de l'adresse connectée (`owed`). */
export function useOwed(): { owed: bigint; isLoading: boolean } {
  const { address } = useConnection()
  const owed = useReadContract({
    ...platform,
    functionName: "owed",
    args: [address ?? zeroAddress],
    query: {
      enabled: ctfPlatformAddress !== undefined && !!address,
      refetchInterval: REFRESH_MS,
    },
  })
  return { owed: owed.data ?? BigInt(0), isLoading: owed.isPending }
}

/** État de l'adresse connectée dans un CTF, lu dans le contrat. */
export function usePlayerState(ctfId: number, levels: number): PlayerState {
  const { address } = useConnection()
  const id = BigInt(ctfId)
  const me = address ?? zeroAddress
  const enabled = ctfPlatformAddress !== undefined

  const podium = useReadContract({
    ...platform,
    functionName: "getPodium",
    args: [id],
    query: { enabled, refetchInterval: REFRESH_MS },
  })

  const indexes = Array.from({ length: levels }, (_, i) => BigInt(i))
  const reads = useReadContracts({
    contracts: [
      { ...platform, functionName: "getPlayer", args: [id, me] } as const,
      ...indexes.flatMap((level) => [
        {
          ...platform,
          functionName: "instanceOf",
          args: [id, level, me],
        } as const,
        {
          ...platform,
          functionName: "isSolved",
          args: [id, level, me],
        } as const,
      ]),
    ],
    allowFailure: false,
    query: { enabled: enabled && !!address, refetchInterval: REFRESH_MS },
  })

  const data = reads.data
  const player = data?.[0] as
    { hasTicket: boolean; refunded: boolean; score: bigint } | undefined
  const instances = indexes.map((_, i) => {
    const instance = data?.[1 + i * 2] as Address | undefined
    return instance && instance !== zeroAddress ? instance : undefined
  })
  const solved = indexes.map((_, i) => data?.[2 + i * 2] === true)

  return {
    address,
    hasTicket: player?.hasTicket ?? false,
    refunded: player?.refunded ?? false,
    score: Number(player?.score ?? BigInt(0)),
    instances,
    solved,
    podium: (podium.data ?? []).filter((a) => a !== zeroAddress),
    isLoading: podium.isPending || (!!address && reads.isPending),
  }
}

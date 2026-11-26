"use client"

import { baseSepolia } from "viem/chains"
import { useReadContract } from "wagmi"

import { ARBITER_TIMEOUT, CONTESTATION_WINDOW } from "@/lib/ctf/dispute"
import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

export type DisputePeriods = {
  /** Fenêtre de contestation après la fin d'un CTF, en secondes. */
  contestation: number
  /** Délai laissé à l'arbitre avant que le litige puisse être clos, en secondes. */
  arbitrator: number
}

const platform = {
  address: ctfPlatformAddress,
  abi: ctfPlatformAbi,
  chainId: baseSepolia.id,
} as const

const enabled = ctfPlatformAddress !== undefined

/**
 * Durées des litiges du déploiement en cours. Elles sont `immutable` dans
 * `CTFPlatform` (48 h et 7 j en vrai, quelques minutes sur le déploiement de
 * démo) : on les lit une fois. En mode démo, et le temps de la lecture, on
 * affiche celles de docs/DESIGN.md.
 */
export function useDisputePeriods(): DisputePeriods {
  // Mêmes lectures que `useCtfs` : wagmi les partage, aucun appel en plus.
  const contestation = useReadContract({
    ...platform,
    functionName: "contestationPeriod",
    query: { enabled, staleTime: Infinity },
  })
  const arbitrator = useReadContract({
    ...platform,
    functionName: "arbitratorTimeout",
    query: { enabled, staleTime: Infinity },
  })
  return {
    contestation:
      contestation.data !== undefined
        ? Number(contestation.data)
        : CONTESTATION_WINDOW,
    arbitrator:
      arbitrator.data !== undefined ? Number(arbitrator.data) : ARBITER_TIMEOUT,
  }
}

"use client"

import { useEffect, useState } from "react"
import { baseSepolia } from "viem/chains"
import { useBlock } from "wagmi"

import { ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

/** Délai de rafraîchissement des lectures du contrat. */
export const REFRESH_MS = 15_000

/**
 * Heure du réseau, en secondes Unix : le plus grand de l'horloge locale et du
 * dernier bloc. En local, `pnpm chain:time` avance le bloc devant l'horloge ;
 * sur Base Sepolia, les deux sont à quelques secondes près.
 */
export function useChainNow(): number {
  const [wall, setWall] = useState(() => Math.floor(Date.now() / 1000))
  const block = useBlock({
    chainId: baseSepolia.id,
    query: {
      enabled: ctfPlatformAddress !== undefined,
      refetchInterval: REFRESH_MS,
    },
  })

  useEffect(() => {
    const timer = setInterval(
      () => setWall(Math.floor(Date.now() / 1000)),
      REFRESH_MS
    )
    return () => clearInterval(timer)
  }, [])

  const blockTime = block.data ? Number(block.data.timestamp) : 0
  return Math.max(wall, blockTime)
}

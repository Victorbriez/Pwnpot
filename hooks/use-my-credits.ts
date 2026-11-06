"use client"

import { zeroAddress } from "viem"
import { useConnection } from "wagmi"

import { usePlatformEvents } from "@/hooks/use-platform-events"
import { useOwed } from "@/hooks/use-player-state"
import { allocateOwed } from "@/lib/ctf/gains"

/**
 * Ce que le contrat doit à l'adresse connectée : le total (`owed`) et sa
 * répartition par CTF, reconstruite depuis les events `Credited`.
 */
export function useMyCredits() {
  const { address } = useConnection()
  const { owed, isLoading } = useOwed()
  const credits = usePlatformEvents(
    "Credited",
    { account: address ?? zeroAddress },
    { enabled: !!address }
  )

  const list = (credits.data ?? []).map((log) => ({
    ctfId: Number(log.args.ctfId),
    amount: log.args.amount,
    blockNumber: log.blockNumber,
    logIndex: log.logIndex,
  }))

  return {
    owed,
    credits: list,
    byCtf: allocateOwed(list, owed),
    isLoading: isLoading || (!!address && credits.isPending),
  }
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { zeroAddress } from "viem"
import { baseSepolia } from "viem/chains"
import { useConnection, usePublicClient } from "wagmi"

import { usePlatformEvents } from "@/hooks/use-platform-events"
import {
  withdrawals as demoWithdrawals,
  type Withdrawal,
} from "@/lib/mock/gains"
import { ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

/** Retraits de l'adresse connectée (events `Withdrawn`), du plus récent au plus ancien. */
export function useWithdrawals(): Withdrawal[] {
  const { address } = useConnection()
  const client = usePublicClient({ chainId: baseSepolia.id })
  const logs = usePlatformEvents(
    "Withdrawn",
    { to: address ?? zeroAddress },
    { enabled: !!address }
  )

  const blocks = [...new Set((logs.data ?? []).map((log) => log.blockNumber))]
  // La date d'un retrait est celle de son bloc.
  const times = useQuery({
    queryKey: ["block-times", blocks.map(String)],
    enabled: !!client && blocks.length > 0,
    queryFn: async () =>
      new Map(
        await Promise.all(
          blocks.map(async (blockNumber) => {
            const block = await client!.getBlock({ blockNumber })
            return [blockNumber, Number(block.timestamp)] as const
          })
        )
      ),
  })

  if (ctfPlatformAddress === undefined) return demoWithdrawals

  return (logs.data ?? [])
    .map((log) => {
      const time = times.data?.get(log.blockNumber)
      return {
        amount: log.args.amount,
        date: time ? new Date(time * 1000).toISOString() : "",
        hash: log.transactionHash,
      }
    })
    .reverse()
}

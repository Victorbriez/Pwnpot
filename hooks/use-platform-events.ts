"use client"

import { useQuery } from "@tanstack/react-query"
import type { ContractEventName, GetContractEventsParameters } from "viem"
import { baseSepolia } from "viem/chains"
import { usePublicClient } from "wagmi"

import { REFRESH_MS } from "@/hooks/use-chain-now"
import {
  ctfPlatformAbi,
  ctfPlatformAddress,
  ctfPlatformDeployBlock,
} from "@/lib/onchain/ctf-platform"

type Abi = typeof ctfPlatformAbi
type EventName = ContractEventName<Abi>
type EventArgs<N extends EventName> = GetContractEventsParameters<
  Abi,
  N
>["args"]

/**
 * Events de CTFPlatform depuis son bloc de déploiement, filtrés sur leurs
 * arguments indexés (`ctfId`, `player`, `account`…). Désactivé en démo, ou
 * tant que `enabled` est faux (par exemple sans wallet connecté).
 */
export function usePlatformEvents<const N extends EventName>(
  eventName: N,
  args?: EventArgs<N>,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const client = usePublicClient({ chainId: baseSepolia.id })
  const active = enabled && ctfPlatformAddress !== undefined && !!client

  return useQuery({
    queryKey: [
      "platform-events",
      ctfPlatformAddress,
      eventName,
      // Les bigint ne passent pas dans une clé : on les convertit en texte.
      JSON.stringify(args ?? {}, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      ),
    ],
    enabled: active,
    refetchInterval: REFRESH_MS,
    queryFn: async () => {
      // Les RPC publics limitent la plage d'un eth_getLogs (50 000 blocs chez
      // publicnode, 200 sur sepolia.base.org) : on lit par tranches.
      const latest = await client!.getBlockNumber()
      const pages = []
      for (
        let from = ctfPlatformDeployBlock;
        from <= latest;
        from += LOG_BLOCK_RANGE
      ) {
        const to = from + LOG_BLOCK_RANGE - BigInt(1)
        pages.push(
          client!.getContractEvents({
            address: ctfPlatformAddress!,
            abi: ctfPlatformAbi,
            eventName,
            args,
            fromBlock: from,
            toBlock: to < latest ? to : latest,
            strict: true,
          } as GetContractEventsParameters<Abi, N, true>)
        )
      }
      return (await Promise.all(pages)).flat()
    },
  })
}

/** Taille d'une tranche de lecture des events (limite de publicnode). */
const LOG_BLOCK_RANGE = BigInt(50_000)

"use client"

import { parseEventLogs, type Address } from "viem"

import { usePlatformTx, type PlatformTx } from "@/hooks/use-platform-tx"
import { totalValue, type CtfParams } from "@/lib/ctf/params"
import { ctfPlatformAbi } from "@/lib/onchain/ctf-platform"

export type CreateCtfState = Omit<PlatformTx, "send" | "receipt"> & {
  /** Numéro du CTF créé, lu dans l'event `CTFCreated`. */
  ctfId?: bigint
  submit: (params: CtfParams, factories: Address[]) => void
}

/** Envoie `createCTF` avec cash prize + caution. */
export function useCreateCtf(): CreateCtfState {
  const { send, receipt, ...tx } = usePlatformTx()

  const ctfId = receipt
    ? parseEventLogs({
        abi: ctfPlatformAbi,
        eventName: "CTFCreated",
        logs: receipt.logs,
      })[0]?.args.ctfId
    : undefined

  const submit = (params: CtfParams, factories: Address[]) =>
    send({
      functionName: "createCTF",
      args: [params, factories],
      value: totalValue(params),
    })

  return { ...tx, ctfId, submit }
}

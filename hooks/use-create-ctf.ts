"use client"

import { useEffect, useRef, useState } from "react"
import { parseEventLogs, type Address, type Hash } from "viem"
import { baseSepolia } from "viem/chains"
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import { totalValue, type CtfParams } from "@/lib/ctf/params"
import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"
import { describeTxError, type TxStatus } from "@/lib/onchain/tx-error"

export type CreateCtfState = {
  status: TxStatus
  hash?: Hash
  ctfId?: bigint
  error?: string
  /** Vrai tant que CTFPlatform n'est pas déployé : l'envoi est simulé. */
  isDemo: boolean
  submit: (params: CtfParams, factories: Address[]) => void
  reset: () => void
}

const DEMO_DELAY = 1_200

/**
 * Envoie `createCTF`. Sans adresse de contrat, simule la transaction pour que
 * le formulaire reste utilisable en démo ; l'interface est la même.
 */
export function useCreateCtf(): CreateCtfState {
  const write = useWriteContract()
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: baseSepolia.id,
  })

  const [demo, setDemo] = useState<{ status: TxStatus; hash?: Hash }>({
    status: "idle",
  })
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const isDemo = ctfPlatformAddress === undefined

  const submit = (params: CtfParams, factories: Address[]) => {
    if (ctfPlatformAddress === undefined) {
      const hash =
        `0x${"0".repeat(56)}${Date.now().toString(16).padStart(8, "0").slice(-8)}` as Hash
      setDemo({ status: "signing" })
      timers.current.push(
        setTimeout(() => setDemo({ status: "confirming", hash }), DEMO_DELAY),
        setTimeout(() => setDemo({ status: "success", hash }), DEMO_DELAY * 2)
      )
      return
    }
    write.mutate({
      address: ctfPlatformAddress,
      abi: ctfPlatformAbi,
      functionName: "createCTF",
      args: [params, factories],
      value: totalValue(params),
      chainId: baseSepolia.id,
    })
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setDemo({ status: "idle" })
    write.reset()
  }

  if (isDemo) return { ...demo, isDemo, submit, reset }

  let status: TxStatus = "idle"
  let error: string | undefined
  let ctfId: bigint | undefined
  if (write.isPending) status = "signing"
  else if (write.isError) {
    status = "error"
    error = describeTxError(write.error)
  } else if (write.data) {
    if (receipt.isError) {
      status = "error"
      error = describeTxError(receipt.error)
    } else if (receipt.data) {
      if (receipt.data.status === "success") {
        status = "success"
        ctfId = parseEventLogs({
          abi: ctfPlatformAbi,
          eventName: "CTFCreated",
          logs: receipt.data.logs,
        })[0]?.args.ctfId
      } else {
        status = "error"
        error = "La transaction a été annulée par le contrat (revert)."
      }
    } else status = "confirming"
  }

  return { status, hash: write.data, ctfId, error, isDemo, submit, reset }
}

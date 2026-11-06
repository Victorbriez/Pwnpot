"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type {
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  Hash,
  TransactionReceipt,
} from "viem"
import { baseSepolia } from "viem/chains"
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"
import { levelErrorsAbi, vaultFactoryAbi } from "@/lib/onchain/level-artifacts"
import { describeTxError, type TxStatus } from "@/lib/onchain/tx-error"

type Abi = typeof ctfPlatformAbi
type Mutability = "payable" | "nonpayable"
type WriteFunction = ContractFunctionName<Abi, Mutability>

/** Un appel d'écriture vers CTFPlatform, typé d'après l'ABI. */
export type PlatformCall = {
  [F in WriteFunction]: {
    functionName: F
    args: ContractFunctionArgs<Abi, Mutability, F>
    value?: bigint
  }
}[WriteFunction]

/** Un appel à la VaultFactory d'un CTF (organisateur seulement). */
export type VaultCall =
  | { to: Address; functionName: "bind"; args: readonly [bigint] }
  | { to: Address; functionName: "recover"; args?: undefined }

/**
 * ABI utilisée pour les appels à la plateforme : on y ajoute les erreurs des
 * factories, que `createInstance` relaie quand la factory revert (NotBound…).
 */
const platformAbiWithLevelErrors = [...ctfPlatformAbi, ...levelErrorsAbi]

export type PlatformTx = {
  status: TxStatus
  hash?: Hash
  error?: string
  receipt?: TransactionReceipt
  /** Vrai tant que CTFPlatform n'est pas déployé : l'envoi est simulé. */
  isDemo: boolean
  /**
   * `onSuccess` est appelé une fois la transaction confirmée, avec le reçu
   * (absent en démo).
   */
  send: (
    call: PlatformCall | VaultCall,
    options?: { onSuccess?: (receipt?: TransactionReceipt) => void }
  ) => void
  reset: () => void
}

const DEMO_DELAY = 1_200

function demoHash(): Hash {
  const suffix = Date.now().toString(16).padStart(8, "0").slice(-8)
  return `0x${"0".repeat(56)}${suffix}`
}

/**
 * Envoie une transaction vers CTFPlatform (ou la VaultFactory d'un CTF) et suit son état : signature,
 * confirmation, succès ou revert (custom error décodée). Sans adresse de
 * contrat, la transaction est simulée avec la même interface.
 */
export function usePlatformTx(): PlatformTx {
  const queryClient = useQueryClient()
  const write = useWriteContract()
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: baseSepolia.id,
  })
  const [demo, setDemo] = useState<{ status: TxStatus; hash?: Hash }>({
    status: "idle",
  })
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const onSuccess = useRef<
    ((receipt?: TransactionReceipt) => void) | undefined
  >(undefined)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const confirmed = receipt.data?.status === "success"
  const confirmedReceipt = confirmed ? receipt.data : undefined
  useEffect(() => {
    if (!confirmedReceipt) return
    onSuccess.current?.(confirmedReceipt)
    onSuccess.current = undefined
    // Toutes les lectures du contrat et des events se rafraîchissent.
    void queryClient.invalidateQueries()
  }, [confirmedReceipt, queryClient])

  const isDemo = ctfPlatformAddress === undefined

  const send: PlatformTx["send"] = (call, options) => {
    onSuccess.current = options?.onSuccess
    if (ctfPlatformAddress === undefined) {
      const hash = demoHash()
      setDemo({ status: "signing" })
      timers.current.push(
        setTimeout(() => setDemo({ status: "confirming", hash }), DEMO_DELAY),
        setTimeout(() => {
          setDemo({ status: "success", hash })
          onSuccess.current?.()
          onSuccess.current = undefined
        }, DEMO_DELAY * 2)
      )
      return
    }
    // L'union d'appels est typée ci-dessus ; wagmi ne sait pas l'inférer seule.
    const request =
      "to" in call
        ? {
            address: call.to,
            abi: vaultFactoryAbi,
            functionName: call.functionName,
            args: call.args,
          }
        : {
            address: ctfPlatformAddress,
            abi: platformAbiWithLevelErrors,
            ...call,
          }
    write.mutate({
      chainId: baseSepolia.id,
      ...request,
    } as Parameters<typeof write.mutate>[0])
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    onSuccess.current = undefined
    setDemo({ status: "idle" })
    write.reset()
  }

  if (isDemo) return { ...demo, isDemo, send, reset }

  let status: TxStatus = "idle"
  let error: string | undefined
  if (write.isPending) status = "signing"
  else if (write.isError) {
    status = "error"
    error = describeTxError(write.error)
  } else if (write.data) {
    if (receipt.isError) {
      status = "error"
      error = describeTxError(receipt.error)
    } else if (receipt.data) {
      if (confirmed) status = "success"
      else {
        status = "error"
        error = "La transaction a été annulée par le contrat (revert)."
      }
    } else status = "confirming"
  }

  return {
    status,
    hash: write.data,
    error,
    receipt: receipt.data,
    isDemo,
    send,
    reset,
  }
}

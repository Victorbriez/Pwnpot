"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  parseEventLogs,
  type Address,
  type Hash,
  type TransactionReceipt,
} from "viem"
import { baseSepolia } from "viem/chains"
import {
  deployContract,
  waitForTransactionReceipt,
  writeContract,
} from "wagmi/actions"

import { totalValue, type CtfParams } from "@/lib/ctf/params"
import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"
import { VAULT_SEED } from "@/lib/onchain/factories"
import {
  levelErrorsAbi,
  vaultFactoryAbi,
  vaultFactoryBytecode,
} from "@/lib/onchain/level-artifacts"
import { describeTxError, type TxStatus } from "@/lib/onchain/tx-error"
import { wagmiConfig } from "@/lib/onchain/wagmi"

/**
 * Une épreuve du CTF : l'adresse de sa factory, ou `"vault"` pour un Coffre
 * à déployer pour ce CTF.
 */
export type FactorySlot = Address | "vault"

/** Transactions de la création, dans l'ordre. */
export type CreateStep = "deploy" | "create" | "bind"

export const createStepLabels: Record<CreateStep, string> = {
  deploy: "Déployer et alimenter le Coffre",
  create: "Publier le CTF",
  bind: "Lier le Coffre au CTF",
}

export type CreateCtfState = {
  status: TxStatus
  hash?: Hash
  error?: string
  /** Vrai tant que CTFPlatform n'est pas déployé : l'envoi est simulé. */
  isDemo: boolean
  /** Étapes de cette création (une seule sans Coffre). */
  steps: CreateStep[]
  /** Étape en cours, ou celle qui a échoué. */
  current?: CreateStep
  done: CreateStep[]
  /** Adresse du Coffre déployé pour ce CTF. */
  vault?: Address
  /** Numéro du CTF créé, lu dans l'event `CTFCreated`. */
  ctfId?: bigint
  /**
   * Une transaction est déjà confirmée : les paramètres ne doivent plus
   * changer, une nouvelle tentative reprend à l'étape suivante.
   */
  started: boolean
  submit: (params: CtfParams, factories: FactorySlot[]) => void
  reset: () => void
}

const DEMO_DELAY = 1_200
const chainId = baseSepolia.id
const platformAbi = [...ctfPlatformAbi, ...levelErrorsAbi]

function demoHash(): Hash {
  const suffix = Date.now().toString(16).padStart(8, "0").slice(-8)
  return `0x${"0".repeat(56)}${suffix}`
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

/** Montant que l'organisateur dépose dans le Coffre : `maxPlayers × SEED`. */
export function vaultFunding(maxPlayers: bigint) {
  return maxPlayers * VAULT_SEED
}

/**
 * Crée un CTF. Avec un Coffre, trois transactions s'enchaînent : déployer la
 * VaultFactory avec `maxPlayers × SEED`, `createCTF`, puis `bind(ctfId)`
 * (docs/CHALLENGES.md, Épreuve 1). Une étape confirmée n'est jamais rejouée.
 */
export function useCreateCtf(): CreateCtfState {
  const queryClient = useQueryClient()
  const isDemo = ctfPlatformAddress === undefined
  const [state, setState] = useState<{
    status: TxStatus
    hash?: Hash
    error?: string
    steps: CreateStep[]
    current?: CreateStep
    done: CreateStep[]
    vault?: Address
    ctfId?: bigint
  }>({ status: "idle", steps: ["create"], done: [] })
  // Progression lue par la boucle async, à jour sans attendre un rendu.
  const progress = useRef<{
    vault?: Address
    created?: boolean
    ctfId?: bigint
  }>({})
  const running = useRef(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const update = (patch: Partial<typeof state>) => {
    if (alive.current) setState((prev) => ({ ...prev, ...patch }))
  }

  /** Envoie une transaction et attend sa confirmation (simulée en démo). */
  const confirm = async (
    step: CreateStep,
    send: () => Promise<Hash>
  ): Promise<TransactionReceipt | undefined> => {
    update({
      current: step,
      status: "signing",
      hash: undefined,
      error: undefined,
    })
    if (isDemo) {
      await sleep(DEMO_DELAY)
      update({ status: "confirming", hash: demoHash() })
      await sleep(DEMO_DELAY)
      return undefined
    }
    const hash = await send()
    update({ status: "confirming", hash })
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId,
    })
    if (receipt.status !== "success")
      throw new Error("La transaction a été annulée par le contrat (revert).")
    return receipt
  }

  const markDone = (step: CreateStep) =>
    alive.current &&
    setState((prev) => ({ ...prev, done: [...prev.done, step] }))

  const submit: CreateCtfState["submit"] = (params, factories) => {
    if (running.current) return
    running.current = true
    const withVault = factories.includes("vault")
    const steps: CreateStep[] = withVault
      ? ["deploy", "create", "bind"]
      : ["create"]
    update({ steps })

    void (async () => {
      try {
        let { vault, ctfId } = progress.current
        const { created } = progress.current

        if (withVault && !vault) {
          const receipt = await confirm("deploy", () =>
            deployContract(wagmiConfig, {
              abi: vaultFactoryAbi,
              bytecode: vaultFactoryBytecode,
              args: [ctfPlatformAddress!],
              value: vaultFunding(params.maxPlayers),
              chainId,
            })
          )
          vault = receipt
            ? (receipt.contractAddress ?? undefined)
            : "0x00000000000000000000000000000000000000aa"
          if (!vault) throw new Error("Adresse du Coffre introuvable.")
          progress.current.vault = vault
          update({ vault })
          markDone("deploy")
        }

        if (!created) {
          const addresses = factories.map((f) => (f === "vault" ? vault! : f))
          const receipt = await confirm("create", () =>
            writeContract(wagmiConfig, {
              address: ctfPlatformAddress!,
              abi: platformAbi,
              functionName: "createCTF",
              args: [params, addresses],
              value: totalValue(params),
              chainId,
            })
          )
          ctfId = receipt
            ? parseEventLogs({
                abi: ctfPlatformAbi,
                eventName: "CTFCreated",
                logs: receipt.logs,
              })[0]?.args.ctfId
            : undefined
          // En démo, pas de vrai numéro : pas de lien vers le CTF.
          if (receipt && ctfId === undefined)
            throw new Error("Numéro du CTF introuvable.")
          progress.current.created = true
          progress.current.ctfId = ctfId
          update({ ctfId })
          markDone("create")
        }

        if (withVault) {
          await confirm("bind", () =>
            writeContract(wagmiConfig, {
              address: vault!,
              abi: vaultFactoryAbi,
              functionName: "bind",
              args: [ctfId ?? BigInt(0)],
              chainId,
            })
          )
          markDone("bind")
        }

        update({ status: "success" })
      } catch (error) {
        update({ status: "error", error: describeTxError(error) })
      } finally {
        running.current = false
        // Nouveaux CTF, soldes, état du Coffre : tout se relit.
        if (!isDemo) void queryClient.invalidateQueries()
      }
    })()
  }

  const reset = () => {
    if (running.current) return
    progress.current = {}
    setState({ status: "idle", steps: ["create"], done: [] })
  }

  return {
    ...state,
    isDemo,
    started: state.done.length > 0,
    submit,
    reset,
  }
}

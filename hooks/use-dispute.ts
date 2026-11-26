"use client"

import { useState } from "react"
import { baseSepolia } from "viem/chains"
import { useConnection, useReadContract } from "wagmi"

import { useChainNow } from "@/hooks/use-chain-now"
import { usePlatformEvents } from "@/hooks/use-platform-events"
import type { PlatformTx } from "@/hooks/use-platform-tx"
import {
  contestBond,
  DEMO_ARBITRATION_FEE,
  phaseDuration,
  type DisputePhase,
  type DisputeState,
} from "@/lib/ctf/dispute"
import { initialDispute } from "@/lib/mock/disputes"
import { type Ctf, type CtfStatus } from "@/lib/ctf/types"
import { ctfPlatformAbi, ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

const statusOf: Record<DisputePhase, CtfStatus> = {
  contestation: "contestation",
  appealed: "appeal",
  finalized: "finalized",
  cheated: "cheated",
}

const phaseOf: Partial<Record<CtfStatus, DisputePhase>> = {
  contestation: "contestation",
  voting: "appealed",
  appeal: "appealed",
  finalized: "finalized",
  cheated: "cheated",
}

type Me = { hasTicket: boolean; isOrganizer: boolean }

export type DisputeModel = {
  state: DisputeState
  status: CtfStatus
  /** Caution de contestation. */
  bond: bigint
  /** Frais de l'arbitre ; `undefined` tant qu'ils ne sont pas lus. */
  fee?: bigint
  canOpen: boolean
  /** Pourquoi le bouton « Ouvrir un litige » est désactivé. */
  openBlocked?: string
  /** L'arbitre n'a pas répondu à temps : n'importe qui peut clore. */
  canClose: boolean
  openDispute: () => void
  closeAfterTimeout: () => void
  /** Commandes qui simulent le temps et l'arbitre : démo seulement. */
  demo?: {
    advance: () => void
    rule: (cheated: boolean) => void
  }
}

export type Dispute = DisputeModel | undefined

function enter(state: DisputeState, phase: DisputePhase): DisputeState {
  return { ...state, phase, remaining: phaseDuration(phase) }
}

function blockedReason(me: Me): string | undefined {
  if (me.isOrganizer)
    return "L'organisateur ne peut pas contester son propre CTF."
  if (!me.hasTicket) return "Réservé aux détenteurs de ticket."
  return undefined
}

/**
 * Litige simulé : les actions passent par `tx` (simulé aussi), le temps et
 * l'arbitre avancent avec les commandes `demo`.
 */
function useDemoDispute(ctf: Ctf | undefined, tx: PlatformTx, me: Me): Dispute {
  const [state, setState] = useState(() => ctf && initialDispute(ctf))
  if (!state || !ctf) return undefined

  const bond = contestBond(ctf.ticketPrice)
  const fee = DEMO_ARBITRATION_FEE
  const ctfId = BigInt(ctf.id)
  const openBlocked = blockedReason(me)

  return {
    state,
    status: statusOf[state.phase],
    bond,
    fee,
    canOpen: state.phase === "contestation" && !openBlocked,
    openBlocked,
    canClose: false,
    openDispute: () =>
      tx.send(
        { functionName: "openDispute", args: [ctfId], value: bond + fee },
        {
          onSuccess: () =>
            setState(
              (s) => s && { ...enter(s, "appealed"), opened: true, mine: true }
            ),
        }
      ),
    closeAfterTimeout: () => {},
    demo: {
      /** Fait passer la phase en cours, comme si son délai était écoulé. */
      advance: () =>
        setState((s) => {
          if (!s) return s
          if (s.phase === "contestation") return enter(s, "finalized")
          if (s.phase === "appealed")
            return { ...enter(s, "finalized"), decision: "timeout" }
          return s
        }),
      /** `giveRuling` de MockArbitrator. */
      rule: (cheated) =>
        setState(
          (s) =>
            s && {
              ...enter(s, cheated ? "cheated" : "finalized"),
              decision: "ruling",
            }
        ),
    },
  }
}

/** Litige lu dans CTFPlatform (`getDispute`, `disputeCost`, event `Ruled`). */
function useChainDispute(
  ctf: Ctf | undefined,
  tx: PlatformTx,
  me: Me
): Dispute {
  const { address } = useConnection()
  const now = useChainNow()
  const ctfId = BigInt(ctf?.id ?? 0)
  const phase = ctf ? phaseOf[ctf.status] : undefined
  const cost = useReadContract({
    address: ctfPlatformAddress,
    abi: ctfPlatformAbi,
    chainId: baseSepolia.id,
    functionName: "disputeCost",
    args: [ctfId],
    query: { enabled: phase === "contestation" },
  })
  const ruled = usePlatformEvents(
    "Ruled",
    { ctfId },
    { enabled: phase === "finalized" || phase === "cheated" }
  )

  const chain = ctf?.chain
  if (!ctf || !phase || !chain) return undefined

  const info = chain.dispute
  const opened = info !== undefined
  const closed = phase === "finalized" || phase === "cheated"
  // Tant que les events `Ruled` se chargent, on ne sait pas encore qui a clos.
  const decision =
    !closed || !opened || ruled.isPending
      ? undefined
      : (ruled.data ?? []).length > 0
        ? "ruling"
        : "timeout"
  const state: DisputeState = {
    phase,
    remaining: ctf.remaining,
    opened,
    mine:
      opened &&
      !!address &&
      info.contester.toLowerCase() === address.toLowerCase(),
    decision,
  }

  const [bond, fee] = cost.data ?? [contestBond(ctf.ticketPrice), undefined]
  const windowOver = now >= chain.contestationEnd
  const openBlocked = !address
    ? "Connecte ton wallet pour contester."
    : windowOver
      ? "La fenêtre de contestation est passée."
      : blockedReason(me)

  return {
    state,
    status: ctf.status,
    bond: info?.bond ?? bond,
    fee: info?.fee ?? fee,
    canOpen: phase === "contestation" && !openBlocked && fee !== undefined,
    openBlocked,
    canClose: phase === "appealed" && !!info && now >= info.timeoutAt,
    openDispute: () => {
      if (fee === undefined) return
      tx.send({
        functionName: "openDispute",
        args: [ctfId],
        value: bond + fee,
      })
    },
    closeAfterTimeout: () =>
      tx.send({ functionName: "applyVoteAfterTimeout", args: [ctfId] }),
  }
}

/** Démo ou contrat : fixé au build par `NEXT_PUBLIC_CTF_PLATFORM_ADDRESS`. */
export const useDispute =
  ctfPlatformAddress === undefined ? useDemoDispute : useChainDispute

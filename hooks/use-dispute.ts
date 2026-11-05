"use client"

import { useState } from "react"

import type { PlatformCall, PlatformTx } from "@/hooks/use-platform-tx"
import {
  contestBond,
  DEMO_ARBITRATION_FEE,
  losingSide,
  phaseDuration,
  quorum,
  voteOutcome,
  type DisputePhase,
  type DisputeState,
} from "@/lib/ctf/dispute"
import { initialDispute } from "@/lib/mock/disputes"
import { type Ctf, type CtfStatus } from "@/lib/ctf/types"

const statusOf: Record<DisputePhase, CtfStatus> = {
  contestation: "contestation",
  voting: "voting",
  appealWindow: "appeal",
  appealed: "appeal",
  finalized: "finalized",
  cheated: "cheated",
}

function enter(state: DisputeState, phase: DisputePhase): DisputeState {
  return { ...state, phase, remaining: phaseDuration(phase) }
}

/** Résultat du vote appliqué tel quel (pas d'appel, ou timeout de l'arbitre). */
function applyVote(state: DisputeState, tickets: number): DisputeState {
  const { cheated } = voteOutcome(state, tickets)
  return enter(state, cheated ? "cheated" : "finalized")
}

export type Dispute = ReturnType<typeof useDispute>

/**
 * Litige d'un CTF terminé. Les actions passent par `tx` (openDispute, vote,
 * appeal). Les commandes `demo` simulent le temps et l'arbitre, qui ne
 * dépendent pas du joueur.
 */
export function useDispute(
  ctf: Ctf,
  tx: PlatformTx,
  me: { hasTicket: boolean; isOrganizer: boolean }
) {
  const [state, setState] = useState(() => initialDispute(ctf))
  const tickets = ctf.players

  if (!state) return undefined

  const outcome = voteOutcome(state, tickets)
  const loser = losingSide(outcome)
  const bond = contestBond(ctf.ticketPrice)
  const fee = DEMO_ARBITRATION_FEE
  const ctfId = BigInt(ctf.id)

  const canOpen =
    state.phase === "contestation" &&
    !state.opened &&
    me.hasTicket &&
    !me.isOrganizer
  const canVote =
    state.phase === "voting" && me.hasTicket && state.myVote === undefined
  const canAppeal =
    state.phase === "appealWindow" &&
    !state.appellant &&
    (loser === "organizer" ? me.isOrganizer : me.hasTicket)

  const openDispute = () =>
    tx.send(
      { functionName: "openDispute", args: [ctfId], value: bond },
      {
        onSuccess: () =>
          setState((s) => s && { ...enter(s, "voting"), opened: true }),
      }
    )

  const vote = (cheated: boolean) =>
    tx.send(
      // `vote` est encore `pure` dans le contrat (litiges pas implémentés) :
      // ce litige ne tourne qu'en démo. À retirer avec l'implémentation (#15).
      {
        functionName: "vote",
        args: [ctfId, cheated],
      } as unknown as PlatformCall,
      {
        onSuccess: () =>
          setState(
            (s) =>
              s && {
                ...s,
                myVote: cheated,
                cheatVotes: s.cheatVotes + (cheated ? 1 : 0),
                fairVotes: s.fairVotes + (cheated ? 0 : 1),
              }
          ),
      }
    )

  const appeal = () =>
    tx.send(
      { functionName: "appeal", args: [ctfId], value: fee },
      {
        onSuccess: () =>
          setState((s) => s && { ...enter(s, "appealed"), appellant: loser }),
      }
    )

  const demo = {
    /** Fait passer la phase en cours, comme si son délai était écoulé. */
    advance: () =>
      setState((s) => {
        if (!s) return s
        switch (s.phase) {
          case "contestation":
            return enter(s, "finalized")
          case "voting": {
            // Les autres joueurs votent : 70 % « triche » jusqu'au quorum.
            const missing = Math.max(
              0,
              quorum(tickets) - (s.cheatVotes + s.fairVotes)
            )
            const cheat = Math.ceil(missing * 0.7)
            return enter(
              {
                ...s,
                cheatVotes: s.cheatVotes + cheat,
                fairVotes: s.fairVotes + missing - cheat,
              },
              "appealWindow"
            )
          }
          case "appealWindow":
            return applyVote(s, tickets)
          case "appealed":
            // Timeout : le résultat du vote s'applique.
            return applyVote(s, tickets)
          default:
            return s
        }
      }),
    /** `rule` de MockArbitrator. */
    rule: (cheated: boolean) =>
      setState(
        (s) =>
          s && {
            ...enter(s, cheated ? "cheated" : "finalized"),
            ruling: cheated,
          }
      ),
  }

  return {
    state,
    status: statusOf[state.phase],
    outcome,
    loser,
    bond,
    fee,
    canOpen,
    canVote,
    canAppeal,
    openDispute,
    vote,
    appeal,
    demo,
  }
}

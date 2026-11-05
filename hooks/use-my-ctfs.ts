"use client"

import { useConnection } from "wagmi"

import { isClosed } from "@/lib/mock/explore"
import {
  myOrganized,
  myParticipations,
  type MyOrganized,
  type MyParticipation,
} from "@/lib/mock/my-ctfs"
import { ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

export type MyCtfs = {
  playing: MyParticipation[]
  organizing: MyOrganized[]
  totals: { active: number; solved: number; owed: bigint }
  /** Vrai tant que CTFPlatform n'est pas déployé : données fictives. */
  isDemo: boolean
  /** Contrat déployé mais aucun wallet connecté. */
  needsWallet: boolean
}

function totalsOf(playing: MyParticipation[], organizing: MyOrganized[]) {
  const all = [...playing, ...organizing]
  const activeIds = new Set(
    all.filter((item) => !isClosed(item.ctf.status)).map((item) => item.ctf.id)
  )
  return {
    active: activeIds.size,
    solved: playing.reduce((sum, p) => sum + p.solved, 0),
    owed: all.reduce((sum, item) => sum + item.owed, BigInt(0)),
  }
}

/**
 * CTF joués et organisés par l'adresse connectée. Sans contrat, renvoie les
 * mocks ; la lecture des events (TicketBought, CTFCreated, LevelSolved…)
 * arrivera avec #11.
 */
export function useMyCtfs(): MyCtfs {
  const { isConnected } = useConnection()

  if (ctfPlatformAddress === undefined) {
    return {
      playing: myParticipations,
      organizing: myOrganized,
      totals: totalsOf(myParticipations, myOrganized),
      isDemo: true,
      needsWallet: false,
    }
  }

  return {
    playing: [],
    organizing: [],
    totals: totalsOf([], []),
    isDemo: false,
    needsWallet: !isConnected,
  }
}

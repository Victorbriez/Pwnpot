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

export type PlayingTotals = { active: number; solved: number; owed: bigint }
export type OrganizingTotals = {
  active: number
  /** Joueurs inscrits sur les CTF organisés, tous confondus. */
  players: number
  /** Cagnottes et cautions encore bloquées dans le contrat. */
  locked: bigint
  owed: bigint
}

export type MyCtfs = {
  playing: MyParticipation[]
  organizing: MyOrganized[]
  /** Tout ce que l'adresse peut retirer, joueur et organisateur confondus. */
  totals: { owed: bigint }
  playingTotals: PlayingTotals
  organizingTotals: OrganizingTotals
  /** Vrai tant que CTFPlatform n'est pas déployé : données fictives. */
  isDemo: boolean
  /** Contrat déployé mais aucun wallet connecté. */
  needsWallet: boolean
}

const sumOwed = (items: { owed: bigint }[]) =>
  items.reduce((sum, item) => sum + item.owed, BigInt(0))

function playingTotalsOf(playing: MyParticipation[]): PlayingTotals {
  return {
    active: playing.filter((p) => !isClosed(p.ctf.status)).length,
    solved: playing.reduce((sum, p) => sum + p.solved, 0),
    owed: sumOwed(playing),
  }
}

function organizingTotalsOf(organizing: MyOrganized[]): OrganizingTotals {
  const open = organizing.filter((o) => !isClosed(o.ctf.status))
  return {
    active: open.length,
    players: organizing.reduce((sum, o) => sum + o.ctf.players, 0),
    locked: open.reduce(
      (sum, o) => sum + o.ctf.prizePool + o.ctf.bond,
      BigInt(0)
    ),
    owed: sumOwed(organizing),
  }
}

function build(
  playing: MyParticipation[],
  organizing: MyOrganized[]
): Omit<MyCtfs, "isDemo" | "needsWallet"> {
  const playingTotals = playingTotalsOf(playing)
  const organizingTotals = organizingTotalsOf(organizing)
  return {
    playing,
    organizing,
    totals: { owed: playingTotals.owed + organizingTotals.owed },
    playingTotals,
    organizingTotals,
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
      ...build(myParticipations, myOrganized),
      isDemo: true,
      needsWallet: false,
    }
  }

  return {
    ...build([], []),
    isDemo: false,
    needsWallet: !isConnected,
  }
}

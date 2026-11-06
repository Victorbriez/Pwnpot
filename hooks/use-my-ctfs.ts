"use client"

import { zeroAddress } from "viem"
import { useConnection } from "wagmi"

import { useCtfs } from "@/hooks/use-ctfs"
import { useMyCredits } from "@/hooks/use-my-credits"
import { usePlatformEvents } from "@/hooks/use-platform-events"
import { rankSolves, type SolveEvent } from "@/lib/ctf/leaderboard"

import { isClosed } from "@/lib/ctf/types"
import type { MyOrganized, MyParticipation } from "@/lib/ctf/types"
import { myOrganized, myParticipations } from "@/lib/mock/my-ctfs"
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
 * CTF joués et organisés par l'adresse connectée. Sans contrat, les mocks ;
 * avec, les events `TicketBought` et `CTFCreated` de l'adresse, le classement
 * (`LevelSolved`) et ce que le contrat lui doit (`owed`, `Credited`).
 */
export function useMyCtfs(): MyCtfs {
  const { address, isConnected } = useConnection()
  const me = address ?? zeroAddress
  const live = ctfPlatformAddress !== undefined && !!address
  const { ctfs } = useCtfs()
  const tickets = usePlatformEvents(
    "TicketBought",
    { player: me },
    { enabled: live }
  )
  const created = usePlatformEvents(
    "CTFCreated",
    { organizer: me },
    { enabled: live }
  )
  const refunds = usePlatformEvents(
    "RefundClaimed",
    { player: me },
    { enabled: live }
  )
  const solves = usePlatformEvents("LevelSolved", undefined, {
    enabled: live,
  })
  const credits = useMyCredits()

  if (ctfPlatformAddress === undefined) {
    return {
      ...build(myParticipations, myOrganized),
      isDemo: true,
      needsWallet: false,
    }
  }
  if (!isConnected) {
    return { ...build([], []), isDemo: false, needsWallet: true }
  }

  const byId = new Map(ctfs.map((ctf) => [ctf.id, ctf]))
  const solvesByCtf = new Map<number, SolveEvent[]>()
  for (const log of solves.data ?? []) {
    const id = Number(log.args.ctfId)
    const list = solvesByCtf.get(id) ?? []
    list.push({
      player: log.args.player,
      timestamp: log.args.timestamp,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
    })
    solvesByCtf.set(id, list)
  }
  const refunded = new Set(
    (refunds.data ?? []).map((log) => Number(log.args.ctfId))
  )
  const owedOf = (id: number) => credits.byCtf.get(id) ?? BigInt(0)

  const playing: MyParticipation[] = (tickets.data ?? []).flatMap((log) => {
    const ctf = byId.get(Number(log.args.ctfId))
    if (!ctf) return []
    const ranking = rankSolves(solvesByCtf.get(ctf.id) ?? [], address)
    const mine = ranking.find((entry) => entry.isMe)
    return [
      {
        ctf,
        solved: mine?.score ?? 0,
        rank: mine?.rank ?? null,
        voted: false,
        owed: owedOf(ctf.id),
        refunded: refunded.has(ctf.id),
      },
    ]
  })

  const organizing: MyOrganized[] = (created.data ?? []).flatMap((log) => {
    const ctf = byId.get(Number(log.args.ctfId))
    if (!ctf) return []
    return [
      {
        ctf,
        owed: owedOf(ctf.id),
        noWinner: (solvesByCtf.get(ctf.id) ?? []).length === 0,
      },
    ]
  })

  const result = build(playing, organizing)
  // Le total vient du contrat : c'est ce que `withdraw()` enverra.
  return {
    ...result,
    totals: { owed: credits.owed },
    isDemo: false,
    needsWallet: false,
  }
}

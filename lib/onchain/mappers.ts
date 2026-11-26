// Convertit ce que renvoie CTFPlatform vers le type `Ctf` affiché par le front.
import type { Address, Hex } from "viem"

import type { Ctf, CtfStatus, Vuln } from "@/lib/ctf/types"
import { describeFactory } from "@/lib/onchain/factories"

/** Struct `CTF` renvoyé par `getCTF`. */
export type ChainCtf = {
  organizer: Address
  title: string
  startTime: bigint
  endTime: bigint
  ticketPrice: bigint
  maxPlayers: bigint
  cashPrize: bigint
  organizerBond: bigint
  playerCount: bigint
  finalized: boolean
  cheated: boolean
}

export type ChainLevel = { factory: Address; codehash: Hex }

/** Struct `Dispute` renvoyé par `getDispute` (litige simplifié : pas de voix). */
export type ChainDispute = {
  contester: Address
  bond: bigint
  openedAt: bigint
  votesCheated: bigint
  votesNotCheated: bigint
  appellant: Address
  appealFee: bigint
  appealedAt: bigint
  disputeID: bigint
  appealed: boolean
  resolved: boolean
}

const ZERO = "0x0000000000000000000000000000000000000000"

/**
 * Phase calculée comme `_phase` du contrat : seuls `finalized` et `cheated`
 * sont stockés, le reste dépend de l'heure. Un litige ouvert et pas encore
 * tranché donne `appeal` (le litige est chez l'arbitre). Pas de vote dans le
 * contrat actuel : la phase `voting` n'existe qu'en démo.
 */
export function phaseAt(
  ctf: ChainCtf,
  now: number,
  dispute?: ChainDispute
): CtfStatus {
  if (ctf.cheated) return "cheated"
  if (ctf.finalized) return "finalized"
  if (now < Number(ctf.startTime)) return "open"
  if (now < Number(ctf.endTime)) return "running"
  if (dispute && dispute.contester !== ZERO) return "appeal"
  return "contestation"
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function toCtf(
  id: number,
  ctf: ChainCtf,
  levels: readonly ChainLevel[],
  {
    now,
    contestationPeriod,
    arbitratorTimeout,
    dispute,
    vaults,
  }: {
    now: number
    contestationPeriod: number
    arbitratorTimeout: number
    dispute?: ChainDispute
    /** Adresses (minuscules) reconnues comme VaultFactory à leur code. */
    vaults?: ReadonlySet<string>
  }
): Ctf {
  const startTime = Number(ctf.startTime)
  const endTime = Number(ctf.endTime)
  const contestationEnd = endTime + contestationPeriod
  const status = phaseAt(ctf, now, dispute)
  const opened = !!dispute && dispute.contester !== ZERO
  const timeoutAt = opened
    ? Number(dispute.appealedAt) + arbitratorTimeout
    : undefined

  let remaining = 0
  let elapsed = 1
  if (status === "open") {
    remaining = startTime - now
    elapsed = 0
  } else if (status === "running") {
    remaining = endTime - now
    elapsed = clamp01((now - startTime) / (endTime - startTime))
  } else if (status === "contestation") {
    remaining = Math.max(0, contestationEnd - now)
    elapsed = clamp01((now - endTime) / contestationPeriod)
  } else if (status === "appeal" && dispute && timeoutAt !== undefined) {
    remaining = Math.max(0, timeoutAt - now)
    elapsed = clamp01((now - Number(dispute.appealedAt)) / arbitratorTimeout)
  }

  const described = levels.map(({ factory, codehash }) => ({
    factory,
    codehash,
    info: describeFactory(factory, vaults),
  }))
  const vulns = [
    ...new Set(
      described
        .map((level) => level.info.vuln)
        .filter((vuln): vuln is Vuln => vuln !== undefined)
    ),
  ]

  return {
    id,
    title: ctf.title || `CTF n° ${id}`,
    organizer: ctf.organizer,
    challenges: levels.length,
    cashPrize: ctf.cashPrize,
    ticketPrice: ctf.ticketPrice,
    prizePool: ctf.cashPrize + ctf.playerCount * ctf.ticketPrice,
    bond: ctf.organizerBond,
    players: Number(ctf.playerCount),
    maxPlayers: Number(ctf.maxPlayers),
    status,
    vulns,
    remaining,
    elapsed,
    chain: {
      startTime,
      endTime,
      contestationEnd,
      levels: described,
      dispute:
        opened && timeoutAt !== undefined
          ? {
              contester: dispute.contester,
              bond: dispute.bond,
              fee: dispute.appealFee,
              disputeId: dispute.disputeID,
              openedAt: Number(dispute.openedAt),
              timeoutAt,
              resolved: dispute.resolved,
            }
          : undefined,
    },
  }
}

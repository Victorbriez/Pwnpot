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

/**
 * Phase calculée comme `_phase` du contrat : seuls `finalized` et `cheated`
 * sont stockés, le reste dépend de l'heure. Les phases de litige (vote,
 * appel) n'existent pas encore dans le contrat.
 */
export function phaseAt(ctf: ChainCtf, now: number): CtfStatus {
  if (ctf.cheated) return "cheated"
  if (ctf.finalized) return "finalized"
  if (now < Number(ctf.startTime)) return "open"
  if (now < Number(ctf.endTime)) return "running"
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
    vaults,
  }: {
    now: number
    contestationPeriod: number
    /** Adresses (minuscules) reconnues comme VaultFactory à leur code. */
    vaults?: ReadonlySet<string>
  }
): Ctf {
  const startTime = Number(ctf.startTime)
  const endTime = Number(ctf.endTime)
  const contestationEnd = endTime + contestationPeriod
  const status = phaseAt(ctf, now)

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
    },
  }
}

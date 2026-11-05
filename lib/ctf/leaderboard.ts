// Classement d'un CTF reconstruit depuis les events `LevelSolved`, avec les
// règles du contrat (docs/DESIGN.md § Score et classement) : 1 point par
// épreuve, à égalité la dernière réussite la plus tôt passe devant, et à
// égalité parfaite celui qui y est arrivé le premier garde sa place.
import type { Address } from "viem"

export type LeaderboardEntry = {
  rank: number
  address: Address
  score: number
  isMe: boolean
}

export type SolveEvent = {
  player: Address
  /** `timestamp` de l'event (secondes). */
  timestamp: bigint
  blockNumber: bigint
  logIndex: number
}

type Tally = {
  address: Address
  score: number
  last: bigint
  /** Position de la dernière réussite dans la chaîne (bloc, puis log). */
  order: [bigint, number]
}

function before(a: [bigint, number], b: [bigint, number]) {
  return a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1]
}

/** Tout le classement, du 1er au dernier joueur ayant marqué. */
export function rankSolves(
  solves: readonly SolveEvent[],
  me?: Address
): LeaderboardEntry[] {
  const byPlayer = new Map<string, Tally>()
  for (const solve of solves) {
    const key = solve.player.toLowerCase()
    const order: [bigint, number] = [solve.blockNumber, solve.logIndex]
    const tally = byPlayer.get(key)
    if (!tally) {
      byPlayer.set(key, {
        address: solve.player,
        score: 1,
        last: solve.timestamp,
        order,
      })
      continue
    }
    tally.score += 1
    if (before(tally.order, order)) {
      tally.last = solve.timestamp
      tally.order = order
    }
  }

  const mine = me?.toLowerCase()
  return [...byPlayer.values()]
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      if (a.last !== b.last) return a.last < b.last ? -1 : 1
      return before(a.order, b.order) ? -1 : 1
    })
    .map((tally, index) => ({
      rank: index + 1,
      address: tally.address,
      score: tally.score,
      isMe: tally.address.toLowerCase() === mine,
    }))
}

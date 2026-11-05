// Données fictives de la page d'un CTF : ses épreuves et son classement.
// Le classement réel sera reconstruit depuis les events `LevelSolved`.
import type { Address } from "viem"

import type { Ctf } from "@/lib/mock/explore"
import { demoAddress, myParticipations } from "@/lib/mock/my-ctfs"
import { knownFactories, type KnownFactory } from "@/lib/onchain/factories"

export type LeaderboardEntry = {
  rank: number
  address: Address
  score: number
  isMe: boolean
}

/** Épreuves du CTF, dans l'ordre (levelIndex). */
export function ctfChallenges(ctf: Ctf): KnownFactory[] {
  return ctf.vulns.flatMap((vuln) => {
    const factory = knownFactories.find((f) => f.vuln === vuln)
    return factory ? [factory] : []
  })
}

function fakeAddress(ctfId: number, rank: number): Address {
  const seed = (ctfId * 7919 + rank * 104_729).toString(16)
  return `0x${seed.repeat(40).slice(0, 40)}`
}

/**
 * Les 10 premiers. Par paquets de trois, le score baisse d'un point ; le
 * joueur de démo prend sa place réelle (lib/mock/my-ctfs.ts).
 */
export function leaderboard(ctf: Ctf): LeaderboardEntry[] {
  if (ctf.status === "open") return []
  const mine = myParticipations.find((p) => p.ctf.id === ctf.id)
  const entries: LeaderboardEntry[] = []
  for (let rank = 1; rank <= Math.min(10, ctf.players); rank++) {
    const isMe = mine?.rank === rank
    const score = isMe
      ? mine.solved
      : Math.max(ctf.challenges - Math.floor((rank - 1) / 3), 0)
    if (score === 0) break
    entries.push({
      rank,
      address: isMe ? demoAddress : fakeAddress(ctf.id, rank),
      score,
      isMe,
    })
  }
  return entries
}

/**
 * Replace le joueur de démo après une réussite. À score égal, ceux qui
 * étaient devant restent devant : ils ont réussi plus tôt (docs/DESIGN.md).
 */
export function withMyScore(
  board: LeaderboardEntry[],
  me: { score: number; rank: number | null }
): LeaderboardEntry[] {
  const others = board.filter((entry) => !entry.isMe)
  if (me.score === 0) return others
  const oldRank = me.rank ?? Number.POSITIVE_INFINITY
  const ahead = others.filter(
    (o) => o.score > me.score || (o.score === me.score && o.rank < oldRank)
  ).length
  const mine: LeaderboardEntry = {
    rank: ahead + 1,
    address: demoAddress,
    score: me.score,
    isMe: true,
  }
  return [...others.slice(0, ahead), mine, ...others.slice(ahead)]
    .slice(0, 10)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

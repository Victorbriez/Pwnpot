// Détail de ce que doit la plateforme à une adresse, CTF par CTF.
// On-chain, `owed` est un seul solde par adresse : ce détail sert à
// l'expliquer, `withdraw()` retire toujours le total.
import { type Ctf } from "@/lib/ctf/types"
import type { MyOrganized, MyParticipation } from "@/lib/ctf/types"

export type GainLine = {
  ctf: Ctf
  amount: bigint
  reason: string
}

function podium(rank: number | null) {
  if (rank === 1) return "1re place du podium"
  if (rank === 2) return "2e place du podium"
  if (rank === 3) return "3e place du podium"
  return "Gain"
}

export function gainLines(
  playing: MyParticipation[],
  organizing: MyOrganized[]
): GainLine[] {
  const zero = BigInt(0)
  return [
    ...playing
      .filter((p) => p.owed > zero)
      .map((p) => ({
        ctf: p.ctf,
        amount: p.owed,
        reason:
          p.ctf.status === "cheated" || p.refunded
            ? "Ticket remboursé"
            : podium(p.rank),
      })),
    ...organizing
      .filter((o) => o.owed > zero)
      .map((o) => ({
        ctf: o.ctf,
        amount: o.owed,
        reason:
          o.ctf.status === "cheated"
            ? "Cash prize rendu"
            : o.noWinner
              ? "Aucun gagnant : cash prize et caution rendus"
              : "Caution rendue",
      })),
  ]
}

/**
 * Parts du podium sur (cash prize + tickets) : 60 / 30 / 10 % à 3 gagnants,
 * 67 / 33 % à 2, tout à 1. Les parts du 2e et du 3e sont calculées d'abord,
 * le reste (arrondis compris) va au 1er : aucun wei ne reste bloqué.
 */
export function podiumShares(pot: bigint, winners: number): bigint[] {
  if (winners <= 0) return []
  if (winners === 1) return [pot]
  if (winners === 2) {
    const second = (pot * BigInt(33)) / BigInt(100)
    return [pot - second, second]
  }
  const second = (pot * BigInt(30)) / BigInt(100)
  const third = (pot * BigInt(10)) / BigInt(100)
  return [pot - second - third, second, third]
}

export type Credit = {
  ctfId: number
  amount: bigint
  blockNumber: bigint
  logIndex: number
}

/**
 * Répartit le solde `owed` réel sur les crédits reçus (events `Credited`),
 * des plus récents aux plus anciens : `withdraw()` vide tout le solde, donc
 * ce qui reste dû vient forcément des derniers crédits. Renvoie le montant
 * encore dû par CTF.
 */
export function allocateOwed(
  credits: readonly Credit[],
  owed: bigint
): Map<number, bigint> {
  const byCtf = new Map<number, bigint>()
  let left = owed
  const newestFirst = [...credits].sort((a, b) =>
    a.blockNumber !== b.blockNumber
      ? a.blockNumber > b.blockNumber
        ? -1
        : 1
      : b.logIndex - a.logIndex
  )
  for (const credit of newestFirst) {
    if (left <= BigInt(0)) break
    const part = credit.amount < left ? credit.amount : left
    byCtf.set(credit.ctfId, (byCtf.get(credit.ctfId) ?? BigInt(0)) + part)
    left -= part
  }
  return byCtf
}

// Détail de ce que doit la plateforme à une adresse, CTF par CTF.
// On-chain, `owed` est un seul solde par adresse : ce détail sert à
// l'expliquer, `withdraw()` retire toujours le total.
import type { Ctf } from "@/lib/mock/explore"
import type { MyOrganized, MyParticipation } from "@/lib/mock/my-ctfs"

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
          p.ctf.status === "cheated" ? "Ticket remboursé" : podium(p.rank),
      })),
    ...organizing
      .filter((o) => o.owed > zero)
      .map((o) => ({
        ctf: o.ctf,
        amount: o.owed,
        reason:
          o.ctf.status === "cheated" ? "Cash prize rendu" : "Caution rendue",
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

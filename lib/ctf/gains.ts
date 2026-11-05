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

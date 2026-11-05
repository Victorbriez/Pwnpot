// Chiffres clés de la page Explorer, calculés depuis la liste des CTF.
import { inDispute, isClosed, type Ctf } from "@/lib/ctf/types"

export type Kpis = {
  lockedPrizePools: bigint
  activeCtfs: number
  activePlayers: number
  /** Épreuves réussies (events `LevelSolved`), `undefined` si inconnu. */
  solved?: number
  bondsAtStake: bigint
  openDisputes: number
}

export function computeKpis(ctfs: Ctf[], solved?: number): Kpis {
  const active = ctfs.filter((ctf) => !isClosed(ctf.status))
  return {
    lockedPrizePools: active.reduce(
      (sum, ctf) => sum + ctf.prizePool,
      BigInt(0)
    ),
    activeCtfs: active.length,
    activePlayers: active.reduce((sum, ctf) => sum + ctf.players, 0),
    solved,
    bondsAtStake: active.reduce((sum, ctf) => sum + ctf.bond, BigInt(0)),
    openDisputes: ctfs.filter((ctf) => inDispute(ctf.status)).length,
  }
}

/** CTF en cours avec la plus grosse cagnotte. */
export function biggestRunning(ctfs: Ctf[]): Ctf | undefined {
  return ctfs
    .filter((ctf) => ctf.status === "running")
    .sort((a, b) => (b.prizePool > a.prizePool ? 1 : -1))[0]
}

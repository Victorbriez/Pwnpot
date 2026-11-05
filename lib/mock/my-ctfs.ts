// Données fictives de la page Mes CTF, en attendant CTFPlatform.
// Elles décrivent un joueur de démo qui organise les CTF 2 et 4 de
// lib/mock/explore.ts et joue aux CTF 1, 3, 5 et 6.
import { parseEther, type Address } from "viem"

import { type Ctf } from "@/lib/ctf/types"
import { ctfs } from "@/lib/mock/explore"

/** Organisateur des CTF 2 et 4 dans les mocks d'Explore. */
export const demoAddress: Address = "0x4ce2a9b7d3f1e5c8a6b4d2f0e8c6a4b2d0f8aa19"

export type MyParticipation = {
  ctf: Ctf
  /** Épreuves réussies (`LevelSolved`). */
  solved: number
  /** Place au classement, `null` sans réussite. */
  rank: number | null
  /** Vote déjà exprimé pendant un litige. */
  voted: boolean
  /** Ce que `owed` crédite à l'adresse pour ce CTF. */
  owed: bigint
}

export type MyOrganized = {
  ctf: Ctf
  owed: bigint
}

function byId(id: number): Ctf {
  const ctf = ctfs.find((item) => item.id === id)
  if (!ctf) throw new Error(`CTF fictif ${id} introuvable`)
  return ctf
}

export const myParticipations: MyParticipation[] = [
  { ctf: byId(1), solved: 2, rank: 4, voted: false, owed: BigInt(0) },
  { ctf: byId(3), solved: 1, rank: 2, voted: false, owed: BigInt(0) },
  { ctf: byId(5), solved: 0, rank: null, voted: false, owed: BigInt(0) },
  // 1er sur le podium : 60 % de la cagnotte (0,4 + 200 × 0,002 = 0,8 ETH).
  { ctf: byId(6), solved: 3, rank: 1, voted: false, owed: parseEther("0.48") },
]

export const myOrganized: MyOrganized[] = [
  { ctf: byId(2), owed: BigInt(0) },
  { ctf: byId(4), owed: BigInt(0) },
]

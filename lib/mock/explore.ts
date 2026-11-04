// Données fictives de la page Explore, en attendant CTFPlatform.
// Elles seront remplacées par la lecture de l'état et des events du contrat.
// Les valeurs suivent docs/DESIGN.md : maxPlayers ≤ 200 et
// caution ≥ cashPrize + maxPlayers × ticketPrice.
import { parseEther, type Address } from "viem"

/** Les trois épreuves de lancement (docs/CHALLENGES.md). */
export type Vuln = "reentrancy" | "tx-origin" | "storage"

/** Phases du cycle de vie d'un CTF (docs/DESIGN.md). */
export type CtfStatus =
  | "open"
  | "running"
  | "contestation"
  | "voting"
  | "appeal"
  | "finalized"
  | "cheated"

export type CtfLevel = "beginner" | "advanced"

export type Ctf = {
  id: number
  title: string
  organizer: Address
  challenges: number
  cashPrize: bigint
  ticketPrice: bigint
  /** Cagnotte : cash prize + tickets vendus. */
  prizePool: bigint
  bond: bigint
  players: number
  maxPlayers: number
  status: CtfStatus
  level: CtfLevel
  vulns: Vuln[]
  /** Secondes avant la fin de la phase en cours. */
  remaining: number
  /** Part de la phase déjà écoulée, entre 0 et 1. */
  elapsed: number
}

export const vulnLabels: Record<Vuln, string> = {
  reentrancy: "Réentrance",
  "tx-origin": "tx.origin",
  storage: "Storage privé",
}

/** Phases où le CTF est terminé et les fonds sont à retirer. */
export function isClosed(status: CtfStatus) {
  return status === "finalized" || status === "cheated"
}

/** Phases où un litige est en cours. */
export function inDispute(status: CtfStatus) {
  return status === "voting" || status === "appeal"
}

function ctf(
  data: Omit<Ctf, "prizePool" | "cashPrize" | "ticketPrice" | "bond"> & {
    cashPrize: string
    ticketPrice: string
    bond: string
  }
): Ctf {
  const cashPrize = parseEther(data.cashPrize)
  const ticketPrice = parseEther(data.ticketPrice)
  return {
    ...data,
    cashPrize,
    ticketPrice,
    bond: parseEther(data.bond),
    prizePool: cashPrize + ticketPrice * BigInt(data.players),
  }
}

export const ctfs: Ctf[] = [
  ctf({
    id: 1,
    title: "Reentrancy Rumble",
    organizer: "0x91b4c2d8e1f07a3b9c5d6e2f4a8b1c3d5e7f9e02",
    challenges: 3,
    cashPrize: "3",
    ticketPrice: "0.02",
    bond: "7",
    players: 168,
    maxPlayers: 200,
    status: "running",
    level: "beginner",
    vulns: ["reentrancy", "tx-origin", "storage"],
    remaining: 2 * 86_400 + 14 * 3_600,
    elapsed: 0.68,
  }),
  ctf({
    id: 2,
    title: "Epitech Lyon Open",
    organizer: "0x4ce2a9b7d3f1e5c8a6b4d2f0e8c6a4b2d0f8aa19",
    challenges: 2,
    cashPrize: "5",
    ticketPrice: "0.05",
    bond: "11",
    players: 64,
    maxPlayers: 120,
    status: "open",
    level: "advanced",
    vulns: ["reentrancy", "storage"],
    remaining: 1 * 86_400 + 6 * 3_600,
    elapsed: 0.4,
  }),
  ctf({
    id: 3,
    title: "Origin Story",
    organizer: "0xd07f3e1a5c9b2d4f6e8a0c2b4d6f8e0a2c4e3bb0",
    challenges: 1,
    cashPrize: "1",
    ticketPrice: "0.01",
    bond: "2",
    players: 97,
    maxPlayers: 100,
    status: "voting",
    level: "beginner",
    vulns: ["tx-origin"],
    remaining: 18 * 3_600 + 5 * 60,
    elapsed: 0.62,
  }),
  ctf({
    id: 4,
    title: "Slot Machine",
    organizer: "0x2a8e6c4b0d9f1e3a5c7b9d1f3e5a7c9b1d3f5c77",
    challenges: 1,
    cashPrize: "0.6",
    ticketPrice: "0.005",
    bond: "1",
    players: 54,
    maxPlayers: 80,
    status: "running",
    level: "beginner",
    vulns: ["storage"],
    remaining: 9 * 3_600 + 40 * 60,
    elapsed: 0.91,
  }),
  ctf({
    id: 5,
    title: "Double Dip",
    organizer: "0x7f1d3b5a9c2e4f6a8b0d2c4e6f8a0b2c4d6e8f31",
    challenges: 2,
    cashPrize: "4",
    ticketPrice: "0.04",
    bond: "10",
    players: 131,
    maxPlayers: 150,
    status: "contestation",
    level: "advanced",
    vulns: ["reentrancy", "tx-origin"],
    remaining: 31 * 3_600,
    elapsed: 0.35,
  }),
  ctf({
    id: 6,
    title: "Hello Ethernaut",
    organizer: "0xb3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9d2",
    challenges: 3,
    cashPrize: "0.4",
    ticketPrice: "0.002",
    bond: "0.8",
    players: 200,
    maxPlayers: 200,
    status: "finalized",
    level: "beginner",
    vulns: ["reentrancy", "tx-origin", "storage"],
    remaining: 0,
    elapsed: 1,
  }),
]

const active = ctfs.filter((item) => !isClosed(item.status))

export const kpis = {
  lockedPrizePools: active.reduce(
    (sum, item) => sum + item.prizePool,
    BigInt(0)
  ),
  activeCtfs: active.length,
  activePlayers: active.reduce((sum, item) => sum + item.players, 0),
  solved: 412,
  bondsAtStake: active.reduce((sum, item) => sum + item.bond, BigInt(0)),
  openDisputes: ctfs.filter((item) => inDispute(item.status)).length,
  trends: { locked: 12.4, players: 8.1, solved: 21 },
}

/** Valeur bloquée par jour, en ETH (affichage seulement). */
export const tvlHistory = Array.from({ length: 90 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 7, 4 + i))
  // Finit autour de la somme des cagnottes actives ci-dessus (~26,6 ETH).
  const base = 9 + i * 0.2
  const wave = Math.sin(i / 3.2) * 0.9 + Math.sin(i / 9) * 1.3
  const total = Math.max(3, base + wave)
  return {
    date: day.toISOString().slice(0, 10),
    total: Number(total.toFixed(2)),
    tickets: Number((total * 0.42 + Math.cos(i / 5) * 0.3).toFixed(2)),
  }
})

export const vulnBreakdown = [
  { vuln: "reentrancy", solved: 176 },
  { vuln: "tx-origin", solved: 139 },
  { vuln: "storage", solved: 97 },
] as const satisfies ReadonlyArray<{ vuln: Vuln; solved: number }>

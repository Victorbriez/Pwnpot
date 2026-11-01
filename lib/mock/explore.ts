// Données fictives de la page Explore, en attendant CTFPlatform.
// Elles seront remplacées par la lecture de l'état et des events du contrat.
import { parseEther, type Address } from "viem"

export type Vuln = "reentrancy" | "tx-origin" | "storage" | "oracle"
export type CtfStatus = "live" | "dispute" | "ended"
export type CtfLevel = "beginner" | "advanced"

export type Ctf = {
  id: number
  title: string
  organizer: Address
  challenges: number
  prizePool: bigint
  ticketPrice: bigint
  bond: bigint
  players: number
  status: CtfStatus
  level: CtfLevel
  vulns: Vuln[]
  /** Secondes avant la fin du CTF, ou du vote si un litige est ouvert. */
  remaining: number
  /** Part de la durée déjà écoulée, entre 0 et 1. */
  elapsed: number
}

export const vulnLabels: Record<Vuln, string> = {
  reentrancy: "Reentrancy",
  "tx-origin": "tx.origin",
  storage: "Stockage privé",
  oracle: "Oracle",
}

export const kpis = {
  lockedPrizePools: parseEther("48.62"),
  activeCtfs: 14,
  activePlayers: 1284,
  solved: 3917,
  bondsAtStake: parseEther("9.4"),
  openDisputes: 2,
  trends: { locked: 12.4, players: 8.1, solved: 21 },
}

export const ctfs: Ctf[] = [
  {
    id: 1,
    title: "Reentrancy Rumble",
    organizer: "0x91b4c2d8e1f07a3b9c5d6e2f4a8b1c3d5e7f9e02",
    challenges: 3,
    prizePool: parseEther("6.84"),
    ticketPrice: parseEther("0.02"),
    bond: parseEther("1.5"),
    players: 342,
    status: "live",
    level: "beginner",
    vulns: ["reentrancy", "tx-origin", "storage"],
    remaining: 2 * 86_400 + 14 * 3_600,
    elapsed: 0.68,
  },
  {
    id: 2,
    title: "Epitech Lyon Open",
    organizer: "0x4ce2a9b7d3f1e5c8a6b4d2f0e8c6a4b2d0f8aa19",
    challenges: 5,
    prizePool: parseEther("12.3"),
    ticketPrice: parseEther("0.05"),
    bond: parseEther("3"),
    players: 186,
    status: "live",
    level: "advanced",
    vulns: ["reentrancy", "oracle"],
    remaining: 5 * 86_400 + 3 * 3_600,
    elapsed: 0.34,
  },
  {
    id: 3,
    title: "Origin Story",
    organizer: "0xd07f3e1a5c9b2d4f6e8a0c2b4d6f8e0a2c4e3bb0",
    challenges: 2,
    prizePool: parseEther("2.15"),
    ticketPrice: parseEther("0.01"),
    bond: parseEther("0.8"),
    players: 97,
    status: "dispute",
    level: "beginner",
    vulns: ["tx-origin"],
    remaining: 18 * 3_600 + 5 * 60,
    elapsed: 0.62,
  },
  {
    id: 4,
    title: "Slot Machine",
    organizer: "0x2a8e6c4b0d9f1e3a5c7b9d1f3e5a7c9b1d3f5c77",
    challenges: 1,
    prizePool: parseEther("1.2"),
    ticketPrice: parseEther("0.005"),
    bond: parseEther("0.5"),
    players: 54,
    status: "live",
    level: "beginner",
    vulns: ["storage"],
    remaining: 9 * 3_600 + 40 * 60,
    elapsed: 0.91,
  },
  {
    id: 5,
    title: "Flash Crash",
    organizer: "0x7f1d3b5a9c2e4f6a8b0d2c4e6f8a0b2c4d6e8f31",
    challenges: 4,
    prizePool: parseEther("8.9"),
    ticketPrice: parseEther("0.04"),
    bond: parseEther("2.5"),
    players: 211,
    status: "live",
    level: "advanced",
    vulns: ["oracle", "reentrancy"],
    remaining: 3 * 86_400 + 7 * 3_600,
    elapsed: 0.22,
  },
  {
    id: 6,
    title: "Hello Ethernaut",
    organizer: "0xb3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9d2",
    challenges: 3,
    prizePool: parseEther("0.9"),
    ticketPrice: parseEther("0.002"),
    bond: parseEther("0.3"),
    players: 408,
    status: "ended",
    level: "beginner",
    vulns: ["tx-origin", "storage"],
    remaining: 0,
    elapsed: 1,
  },
]

/** Valeur bloquée par jour, en ETH (affichage seulement). */
export const tvlHistory = Array.from({ length: 90 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 7, 4 + i))
  const base = 14 + i * 0.33
  const wave = Math.sin(i / 3.2) * 1.6 + Math.sin(i / 9) * 2.2
  const total = Math.max(4, base + wave)
  return {
    date: day.toISOString().slice(0, 10),
    total: Number(total.toFixed(2)),
    tickets: Number((total * 0.42 + Math.cos(i / 5) * 0.6).toFixed(2)),
  }
})

export const vulnBreakdown = [
  { vuln: "reentrancy", solved: 1488 },
  { vuln: "tx-origin", solved: 979 },
  { vuln: "storage", solved: 784 },
  { vuln: "oracle", solved: 666 },
] as const satisfies ReadonlyArray<{ vuln: Vuln; solved: number }>

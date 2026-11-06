// Types d'un CTF tel que le front l'affiche, qu'il vienne du contrat
// (lib/onchain/mappers.ts) ou des données de démo (lib/mock/).
import type { Address, Hex } from "viem"

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

/** Identifiant des trois épreuves de lancement (lib/onchain/factories.ts). */
export type KnownFactoryId = "vault" | "impostor" | "code-safe"

/** Ce que le front sait d'une factory à partir de son adresse (et de son code). */
export type FactoryInfo = {
  id?: KnownFactoryId
  name: string
  vuln?: Vuln
  /** Factory connue : adresse officielle, ou code identique à celui du repo. */
  known: boolean
  /**
   * Reconnue à son code (Coffre déployé par l'organisateur), pas à son
   * adresse : Sourcify ne la connaît pas, le badge le dit autrement.
   */
  matchedByCode?: boolean
}

/** Une épreuve telle qu'enregistrée par le contrat (`getLevels`). */
export type CtfLevelInfo = {
  factory: Address
  codehash: Hex
  info: FactoryInfo
}

/** Données propres au contrat, absentes en démo. Temps en secondes Unix. */
export type CtfChainInfo = {
  startTime: number
  endTime: number
  /** Fin de la fenêtre de contestation : `finalize` possible à partir de là. */
  contestationEnd: number
  levels: CtfLevelInfo[]
}

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
  /** Niveau affiché en démo ; le contrat n'a pas cette donnée. */
  level?: CtfLevel
  vulns: Vuln[]
  /** Secondes avant la fin de la phase en cours. */
  remaining: number
  /** Part de la phase déjà écoulée, entre 0 et 1. */
  elapsed: number
  chain?: CtfChainInfo
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

/** Un CTF joué par l'adresse connectée. */
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
  /** Ticket remboursé avec `claimRefund` (CTF sans gagnant). */
  refunded?: boolean
}

export type MyOrganized = {
  ctf: Ctf
  owed: bigint
  /** CTF finalisé sans aucune épreuve réussie : cash prize rendu. */
  noWinner?: boolean
}

// Règles des litiges (docs/DESIGN.md, « Litiges et appel » et « Flux
// d'argent »). Fonctions pures : le contrat reste la référence.
//
// Le contrat déployé applique la version simplifiée : la contestation part
// directement à l'arbitre ERC-792, sans vote des joueurs ni appel. Les
// constantes du vote (`VOTE_WINDOW`, `APPEAL_WINDOW`, `quorum`) décrivent le
// design complet, présenté dans la doc.
import { parseEther } from "viem"

export const CONTESTATION_WINDOW = 48 * 3_600
export const VOTE_WINDOW = 48 * 3_600
export const APPEAL_WINDOW = 24 * 3_600
export const ARBITER_TIMEOUT = 7 * 86_400

/** Frais de MockArbitrator, inférieurs au minimum de la caution de contestation. */
export const DEMO_ARBITRATION_FEE = parseEther("0.0005")
const MIN_CONTEST_BOND = parseEther("0.001")

/**
 * Étapes d'un CTF terminé (version simplifiée) : `contestation`, puis
 * `appealed` si un litige est ouvert (l'arbitre doit trancher), puis le
 * résultat.
 */
export type DisputePhase = "contestation" | "appealed" | "finalized" | "cheated"

/** Comment le litige a été clos. */
export type DisputeDecision = "ruling" | "timeout"

export type DisputeState = {
  phase: DisputePhase
  /** Secondes avant la fin de la phase en cours. */
  remaining: number
  opened: boolean
  /** Le contestataire est l'adresse connectée. */
  mine?: boolean
  /** Clos par une décision de l'arbitre, ou par le timeout. */
  decision?: DisputeDecision
}

/** max(3 × prix du ticket, 0,001 ETH). */
export function contestBond(ticketPrice: bigint): bigint {
  const bond = ticketPrice * BigInt(3)
  return bond > MIN_CONTEST_BOND ? bond : MIN_CONTEST_BOND
}

/** max(3 votants, 20 % des tickets), arrondi au-dessus (design complet). */
export function quorum(tickets: number): number {
  return Math.max(3, Math.ceil(tickets / 5))
}

/** Durée de chaque phase, pour repartir à zéro quand on y entre. */
export function phaseDuration(phase: DisputePhase): number {
  switch (phase) {
    case "contestation":
      return CONTESTATION_WINDOW
    case "appealed":
      return ARBITER_TIMEOUT
    default:
      return 0
  }
}

export type SettlementLine = { who: string; what: string }

/** Qui récupère quoi à la fin (tableau « Flux d'argent »). */
export function settlement(state: DisputeState): SettlementLine[] {
  const cheated = state.phase === "cheated"
  const lines: SettlementLine[] = cheated
    ? [
        { who: "Joueurs", what: "Ticket remboursé" },
        {
          who: "Organisateur",
          what: "Caution brûlée (moins les frais d'arbitrage), cash prize rendu",
        },
      ]
    : [
        { who: "Podium", what: "Cash prize + tickets, 60 / 30 / 10 %" },
        {
          who: "Organisateur",
          what: state.opened
            ? "Sa caution + la caution du contestataire"
            : "Sa caution",
        },
      ]
  if (state.opened) {
    lines.push({
      who: "Contestataire",
      what: cheated
        ? "Caution et frais d'arbitrage rendus"
        : "Perd sa caution et les frais d'arbitrage",
    })
  }
  return lines
}

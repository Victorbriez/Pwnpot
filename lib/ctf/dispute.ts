// Règles des litiges (docs/DESIGN.md, « Litiges et appel » et « Flux
// d'argent »). Fonctions pures : le contrat reste la référence.
import { parseEther } from "viem"

export const CONTESTATION_WINDOW = 48 * 3_600
export const VOTE_WINDOW = 48 * 3_600
export const APPEAL_WINDOW = 24 * 3_600
export const ARBITER_TIMEOUT = 7 * 86_400

/** Frais de MockArbitrator, inférieurs au minimum de la caution de contestation. */
export const DEMO_ARBITRATION_FEE = parseEther("0.0005")
const MIN_CONTEST_BOND = parseEther("0.001")

/**
 * Étapes d'un CTF terminé. `appealWindow` : le camp perdant peut faire
 * appel ; `appealed` : l'arbitre doit trancher.
 */
export type DisputePhase =
  | "contestation"
  | "voting"
  | "appealWindow"
  | "appealed"
  | "finalized"
  | "cheated"

export type Side = "organizer" | "players"

export type DisputeState = {
  phase: DisputePhase
  /** Secondes avant la fin de la phase en cours. */
  remaining: number
  opened: boolean
  cheatVotes: number
  fairVotes: number
  /** Vote de l'adresse connectée, s'il y en a un. */
  myVote?: boolean
  /** Camp qui a fait appel. */
  appellant?: Side
  /** Décision de l'arbitre (`rule`) ; absente en cas de timeout. */
  ruling?: boolean
}

/** max(3 × prix du ticket, 0,001 ETH). */
export function contestBond(ticketPrice: bigint): bigint {
  const bond = ticketPrice * BigInt(3)
  return bond > MIN_CONTEST_BOND ? bond : MIN_CONTEST_BOND
}

/** max(3 votants, 20 % des tickets), arrondi au-dessus. */
export function quorum(tickets: number): number {
  return Math.max(3, Math.ceil(tickets / 5))
}

export type VoteOutcome = {
  voters: number
  quorum: number
  quorumReached: boolean
  /** Triche retenue : plus de 50 % des voix exprimées et quorum atteint. */
  cheated: boolean
}

export function voteOutcome(state: DisputeState, tickets: number): VoteOutcome {
  const voters = state.cheatVotes + state.fairVotes
  const needed = quorum(tickets)
  const quorumReached = voters >= needed
  return {
    voters,
    quorum: needed,
    quorumReached,
    cheated: quorumReached && state.cheatVotes * 2 > voters,
  }
}

/** Camp perdant du vote : c'est lui qui peut faire appel. */
export function losingSide(outcome: VoteOutcome): Side {
  return outcome.cheated ? "organizer" : "players"
}

/** Durée de chaque phase, pour repartir à zéro quand on y entre. */
export function phaseDuration(phase: DisputePhase): number {
  switch (phase) {
    case "contestation":
      return CONTESTATION_WINDOW
    case "voting":
      return VOTE_WINDOW
    case "appealWindow":
      return APPEAL_WINDOW
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
        { who: "Organisateur", what: "Caution brûlée, cash prize rendu" },
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
      what: cheated ? "Caution de contestation rendue" : "Perd sa caution",
    })
  }
  if (state.appellant) {
    const won =
      (state.appellant === "organizer" && !cheated) ||
      (state.appellant === "players" && cheated)
    lines.push({
      who: "Appelant",
      what: won
        ? "Frais d'arbitrage remboursés par le camp perdant"
        : "Frais d'arbitrage perdus",
    })
  }
  return lines
}

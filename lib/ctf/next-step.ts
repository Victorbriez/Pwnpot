// Ce que l'utilisateur doit faire ensuite sur un CTF, selon la phase
// (docs/DESIGN.md, cycle de vie). Fonctions pures : la page n'affiche que du texte.
import { formatEth, formatRemaining } from "@/lib/format"
import type { MyOrganized, MyParticipation } from "@/lib/mock/my-ctfs"

export type NextStep = {
  label: string
  /** `action` : quelque chose à faire ; `money` : des fonds à retirer. */
  tone: "neutral" | "action" | "warning" | "money"
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? "s" : ""}`
}

export function playerNextStep(p: MyParticipation): NextStep {
  const { ctf } = p
  const left = formatRemaining(ctf.remaining)
  switch (ctf.status) {
    case "open":
      return { label: `Commence dans ${left}`, tone: "neutral" }
    case "running": {
      const todo = ctf.challenges - p.solved
      return todo > 0
        ? {
            label: `Encore ${plural(todo, "épreuve")} · fin dans ${left}`,
            tone: "action",
          }
        : { label: `Tout est résolu · fin dans ${left}`, tone: "neutral" }
    }
    case "contestation":
      return ctf.remaining > 0
        ? { label: `Contestation possible encore ${left}`, tone: "neutral" }
        : { label: "Prêt à être finalisé", tone: "action" }
    case "voting":
      return p.voted
        ? { label: "Tu as voté", tone: "neutral" }
        : { label: `Vote avant ${left}`, tone: "warning" }
    case "appeal":
      return { label: `Appel en cours · ${left}`, tone: "warning" }
    case "finalized":
    case "cheated":
      return p.owed > BigInt(0)
        ? { label: `${formatEth(p.owed)} à retirer`, tone: "money" }
        : { label: "Rien à retirer", tone: "neutral" }
  }
}

export function organizerNextStep(o: MyOrganized): NextStep {
  const { ctf } = o
  const left = formatRemaining(ctf.remaining)
  switch (ctf.status) {
    case "open":
      return {
        label: `Inscriptions ouvertes · début dans ${left}`,
        tone: "neutral",
      }
    case "running":
      return { label: `Rien à faire · fin dans ${left}`, tone: "neutral" }
    case "contestation":
      return ctf.remaining > 0
        ? { label: `Contestation possible encore ${left}`, tone: "neutral" }
        : { label: "Prêt à être finalisé", tone: "action" }
    case "voting":
    case "appeal":
      return { label: "Litige en cours", tone: "warning" }
    case "finalized":
      return o.owed > BigInt(0)
        ? { label: `${formatEth(o.owed)} à retirer`, tone: "money" }
        : { label: "Clôturé", tone: "neutral" }
    case "cheated":
      return { label: "Caution brûlée, cash prize rendu", tone: "warning" }
  }
}

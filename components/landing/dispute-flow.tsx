import { StepList, type Step } from "@/components/site/step-list"
import { contestBond } from "@/lib/ctf/dispute"
import { formatEth } from "@/lib/format"

// Plancher de la caution de contestation (avec un ticket gratuit).
const minContestBond = formatEth(contestBond(BigInt(0)))

// Version simplifiée déployée (docs/DESIGN.md § Litiges et appel) : la
// contestation part directement à l'arbitre, sans vote ni appel.
const steps: Step[] = [
  {
    title: "Ouvrir le litige",
    who: "Un détenteur de ticket",
    duration: "48 h après la deadline",
    body: `Il dépose une caution de contestation (3 × le ticket, ${minContestBond} au minimum) et avance les frais de l'arbitre. Un seul litige par CTF. Rejeté, il perd sa caution au profit de l'organisateur, et les frais.`,
    call: "openDispute(ctfId)",
  },
  {
    title: "Décision de l'arbitre",
    who: "L'arbitre ERC-792",
    duration: "7 jours au plus",
    body: "Triche confirmée ou litige rejeté : sa décision est définitive. Il ne tranche que les fonds du litige, jamais ceux des autres CTF.",
    call: "rule(disputeID, ruling)",
  },
  {
    title: "Sans réponse",
    who: "N'importe qui",
    duration: "après le timeout",
    body: "Si l'arbitre se tait, n'importe qui clôt le litige, qui est rejeté. Aucune étape ne dépend d'un acteur précis.",
    call: "applyVoteAfterTimeout(ctfId)",
    fallback: true,
  },
]

export function DisputeFlow() {
  return (
    <div className="flex flex-col gap-8">
      <StepList steps={steps} />
      <p className="text-xs text-pretty text-muted-foreground">
        Version déployée, simplifiée : le design complet ajoute un vote des
        joueurs puis un appel avant l&apos;arbitre. Durées raccourcies à
        quelques minutes pour la démo.
      </p>
    </div>
  )
}

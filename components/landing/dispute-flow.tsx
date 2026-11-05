import { StepList, type Step } from "@/components/site/step-list"
import { contestBond } from "@/lib/ctf/dispute"
import { formatEth } from "@/lib/format"

// Plancher de la caution de contestation (avec un ticket gratuit).
const minContestBond = formatEth(contestBond(BigInt(0)))

// Étapes et durées de docs/DESIGN.md (§ Litiges et appel, § Paramètres).
const steps: Step[] = [
  {
    title: "Ouvrir le litige",
    who: "Un détenteur de ticket",
    duration: "48 h après la deadline",
    body: `Il dépose une caution de contestation : 3 × le ticket, ${minContestBond} au minimum. Un seul litige par CTF. Rejeté, il perd sa caution au profit de l'organisateur.`,
    call: "openDispute(ctfId)",
  },
  {
    title: "Voter",
    who: "Les détenteurs de tickets",
    duration: "48 h",
    body: "1 ticket = 1 voix. La triche est retenue avec plus de 50 % des voix exprimées, à condition d'avoir au moins 3 votants et au moins 20 % des tickets. Quorum raté : pas de triche.",
    call: "vote(ctfId, cheated)",
  },
  {
    title: "Faire appel",
    who: "Le camp perdant",
    duration: "24 h",
    body: "L'organisateur ou un joueur paie les frais d'arbitrage. Le litige part chez l'arbitre ERC-792 fixé au déploiement.",
    call: "appeal(ctfId)",
  },
  {
    title: "Décision de l'arbitre",
    who: "L'arbitre",
    duration: "7 jours au plus",
    body: "Sa décision est définitive. Il ne tranche que les fonds du litige, jamais ceux des autres CTF.",
    call: "rule(disputeID, ruling)",
  },
  {
    title: "Sans réponse",
    who: "N'importe qui",
    duration: "après le timeout",
    body: "Si l'arbitre se tait, le résultat du vote s'applique. Aucune étape ne dépend d'un acteur précis.",
    call: "applyVoteAfterTimeout(ctfId)",
    fallback: true,
  },
]

export function DisputeFlow() {
  return (
    <div className="flex flex-col gap-8">
      <StepList steps={steps} />
      <p className="text-xs text-pretty text-muted-foreground">
        Durées et seuils proposés dans le dossier de conception, raccourcis à
        quelques minutes pour la démo.
      </p>
    </div>
  )
}

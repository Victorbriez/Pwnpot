import { contestBond } from "@/lib/ctf/dispute"
import { formatEth } from "@/lib/format"
import { cn } from "@/lib/utils"

// Plancher de la caution de contestation (avec un ticket gratuit).
const minContestBond = formatEth(contestBond(BigInt(0)))

// Étapes et durées de docs/DESIGN.md (§ Litiges et appel, § Paramètres).
const steps: {
  title: string
  who: string
  duration: string
  body: string
  call: string
}[] = [
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
  },
]

export function DisputeFlow() {
  return (
    <div className="flex flex-col gap-8">
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const last = index === steps.length - 1
          return (
            <li
              key={step.title}
              className="grid grid-cols-[2rem_1fr] gap-x-4 sm:grid-cols-[2rem_9rem_1fr] sm:gap-x-6"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-medium tabular-nums",
                    last
                      ? "border-dashed text-muted-foreground"
                      : "bg-background text-foreground"
                  )}
                >
                  {index + 1}
                </span>
                {!last && <span aria-hidden className="w-px grow bg-border" />}
              </div>
              <p className="hidden pt-1.5 text-sm text-muted-foreground tabular-nums sm:block">
                {step.duration}
              </p>
              <div className={cn("flex flex-col gap-2 pt-1", !last && "pb-9")}>
                <h3 className="font-medium">
                  {step.title}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    par {step.who.charAt(0).toLowerCase() + step.who.slice(1)}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground tabular-nums sm:hidden">
                  {step.duration}
                </p>
                <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                  {step.body}
                </p>
                <code className="w-fit font-mono text-xs [overflow-wrap:anywhere] text-secondary-foreground">
                  {step.call}
                </code>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-pretty text-muted-foreground">
        Durées et seuils proposés dans le dossier de conception, raccourcis à
        quelques minutes pour la démo.
      </p>
    </div>
  )
}

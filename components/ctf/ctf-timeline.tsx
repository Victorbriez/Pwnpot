import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { inDispute, type Ctf, type CtfStatus } from "@/lib/ctf/types"
import { cn } from "@/lib/utils"

type Step = {
  label: string
  /** Date affichée sous l'étape (mode contrat seulement). */
  date?: string
}

/** Position de chaque phase dans la frise. Litige et appel restent sur la 3e. */
const stepIndex: Record<CtfStatus, number> = {
  open: 0,
  running: 1,
  contestation: 2,
  voting: 2,
  appeal: 2,
  finalized: 3,
  cheated: 3,
}

function formatDate(seconds: number) {
  return format(new Date(seconds * 1000), "d MMM, HH:mm", { locale: fr })
}

/**
 * Frise du cycle de vie d'un CTF (docs/DESIGN.md) : inscriptions, épreuves,
 * contestation, résultat. L'étape en cours montre sa progression. Les dates
 * viennent du contrat ; en démo, seules les étapes s'affichent.
 */
export function CtfTimeline({ ctf }: { ctf: Ctf }) {
  const chain = ctf.chain
  const current = stepIndex[ctf.status]
  const dispute = inDispute(ctf.status)

  const steps: Step[] = [
    {
      label: "Inscriptions",
      date: chain && `jusqu'au ${formatDate(chain.startTime)}`,
    },
    { label: "Épreuves", date: chain && formatDate(chain.startTime) },
    {
      label: dispute ? "Litige" : "Contestation",
      date: chain && formatDate(chain.endTime),
    },
    {
      label: ctf.status === "cheated" ? "Triche confirmée" : "Résultat",
      // Un litige repousse le résultat : la date prévue ne tient plus.
      date: chain && !dispute ? formatDate(chain.contestationEnd) : undefined,
    },
  ]

  return (
    <ol
      aria-label="Déroulement du CTF"
      className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-2"
    >
      {steps.map((step, index) => {
        const state =
          index < current ? "done" : index === current ? "current" : "next"
        const last = index === steps.length - 1
        // Dernière étape atteinte : rien ne progresse plus.
        const fill =
          state === "done" || (state === "current" && last)
            ? 1
            : state === "current"
              ? Math.min(Math.max(ctf.elapsed, 0.02), 1)
              : 0
        return (
          <li
            key={index}
            aria-current={state === "current" ? "step" : undefined}
            className="flex flex-col gap-2"
          >
            <div
              aria-hidden
              className="h-1 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  state === "done" ? "bg-muted-foreground/50" : "bg-primary",
                  state === "current" && dispute && "bg-warning"
                )}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  state === "next" && "text-muted-foreground",
                  state === "current" && "text-foreground"
                )}
              >
                {step.label}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {step.date ?? (state === "current" ? "en ce moment" : "—")}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

import { cn } from "@/lib/utils"

export type Step = {
  title: string
  /** Qui agit : « par un détenteur de ticket ». */
  who?: string
  /** Durée ou moment, affiché dans une colonne à part sur grand écran. */
  duration?: string
  body: React.ReactNode
  /** Fonction du contrat appelée à cette étape. */
  call?: string
  /** Étape de repli (ex. timeout) : pastille en pointillés. */
  fallback?: boolean
}

/** Frise d'étapes numérotées : cycle d'un litige, parcours d'un joueur… */
export function StepList({ steps }: { steps: Step[] }) {
  const withDuration = steps.some((step) => step.duration)
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return (
          <li
            key={step.title}
            className={cn(
              "grid grid-cols-[2rem_1fr] gap-x-4",
              withDuration && "sm:grid-cols-[2rem_9rem_1fr] sm:gap-x-6"
            )}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-medium tabular-nums",
                  step.fallback
                    ? "border-dashed text-muted-foreground"
                    : "bg-background text-foreground"
                )}
              >
                {index + 1}
              </span>
              {!last && <span aria-hidden className="w-px grow bg-border" />}
            </div>
            {withDuration && (
              <p className="hidden pt-1.5 text-sm text-muted-foreground tabular-nums sm:block">
                {step.duration}
              </p>
            )}
            <div className={cn("flex flex-col gap-2 pt-1", !last && "pb-9")}>
              <h3 className="font-medium">
                {step.title}
                {step.who && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    par {step.who.charAt(0).toLowerCase() + step.who.slice(1)}
                  </span>
                )}
              </h3>
              {step.duration && (
                <p className="text-sm text-muted-foreground tabular-nums sm:hidden">
                  {step.duration}
                </p>
              )}
              <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                {step.body}
              </p>
              {step.call && (
                <code className="w-fit font-mono text-xs [overflow-wrap:anywhere] text-secondary-foreground">
                  {step.call}
                </code>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

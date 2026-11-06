import { cn } from "@/lib/utils"

/** Liste clé / valeur des cartes de résumé (montants, scores, règlement). */
export function DataList({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl className={cn("flex flex-col gap-2.5 text-sm", className)} {...props} />
  )
}

export function DataRow({
  label,
  hint,
  strong = false,
  children,
}: {
  label: React.ReactNode
  /** Précision sous le libellé (formule, détail). */
  hint?: React.ReactNode
  /** Ligne mise en avant (total). */
  strong?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </dt>
      <dd
        className={cn(
          "text-right font-medium tabular-nums",
          strong && "text-base font-semibold"
        )}
      >
        {children}
      </dd>
    </div>
  )
}

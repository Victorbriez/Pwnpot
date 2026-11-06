import { cn } from "@/lib/utils"

export type Stat = {
  label: string
  value: string
  caption: string
  /** Tendance (démo) ou alerte, affichée à côté de la valeur. */
  trend?: string
  trendTone?: "success" | "warning"
}

/**
 * Chiffres clés de la plateforme sur une seule bande : ils situent la page
 * sans prendre la place de la liste des CTF.
 */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "flex flex-col gap-1 p-4 sm:px-5",
            // Séparateurs entre cellules, sur 2 colonnes puis sur 4.
            index % 2 === 1 && "border-l",
            index >= 2 && "border-t lg:border-t-0",
            index === 2 && "lg:border-l"
          )}
        >
          <dt className="text-xs text-muted-foreground sm:text-sm">
            {stat.label}
          </dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
              {stat.value}
            </span>
            {stat.trend && (
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  stat.trendTone === "warning"
                    ? "text-warning-text"
                    : "text-success-text"
                )}
              >
                {stat.trend}
              </span>
            )}
          </dd>
          <dd className="text-xs text-pretty text-muted-foreground">
            {stat.caption}
          </dd>
        </div>
      ))}
    </dl>
  )
}

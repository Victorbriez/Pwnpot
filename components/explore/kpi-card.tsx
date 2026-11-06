import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  caption,
  trend,
  trendVariant = "success",
  action,
  className,
}: {
  label: string
  value: string
  caption: string
  trend?: string
  trendVariant?: "success" | "warning"
  /** Lien ou bouton affiché à droite du titre. */
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        "gap-2 rounded-2xl py-4 [--card-spacing:--spacing(4)] sm:gap-3 sm:py-6 sm:[--card-spacing:--spacing(6)]",
        className
      )}
    >
      <CardHeader>
        <CardDescription className="font-medium">{label}</CardDescription>
        {(trend || action) && (
          <CardAction>
            {action ?? <Badge variant={trendVariant}>{trend}</Badge>}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
          {value}
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">{caption}</p>
      </CardContent>
    </Card>
  )
}

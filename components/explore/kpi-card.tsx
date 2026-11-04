import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

export function KpiCard({
  label,
  value,
  caption,
  trend,
  trendVariant = "success",
}: {
  label: string
  value: string
  caption: string
  trend?: string
  trendVariant?: "success" | "warning"
}) {
  return (
    <Card className="gap-3 rounded-2xl py-6 [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardDescription className="text-[0.8125rem] font-medium">
          {label}
        </CardDescription>
        {trend && (
          <CardAction>
            <Badge variant={trendVariant}>{trend}</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-[0.8125rem] text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

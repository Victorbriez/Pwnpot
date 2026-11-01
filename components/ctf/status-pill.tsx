import { Badge } from "@/components/ui/badge"
import type { CtfStatus } from "@/lib/mock/explore"
import { cn } from "@/lib/utils"

const statusMeta = {
  live: { label: "En cours", variant: "success", dot: "bg-success" },
  dispute: { label: "Litige ouvert", variant: "warning", dot: "bg-warning" },
  ended: { label: "Terminé", variant: "muted", dot: "bg-muted-foreground" },
} as const satisfies Record<
  CtfStatus,
  { label: string; variant: "success" | "warning" | "muted"; dot: string }
>

export function StatusPill({ status }: { status: CtfStatus }) {
  const meta = statusMeta[status]
  return (
    <Badge variant={meta.variant} className="h-6 gap-1.5 px-2.5">
      <span aria-hidden className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  )
}

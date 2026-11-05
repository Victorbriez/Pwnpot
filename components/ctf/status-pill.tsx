import { Badge } from "@/components/ui/badge"
import { type CtfStatus } from "@/lib/ctf/types"
import { cn } from "@/lib/utils"

type Variant = "brand" | "success" | "warning" | "info" | "muted"

// Une entrée par phase du cycle de vie (docs/DESIGN.md).
const statusMeta = {
  open: { label: "Inscriptions", variant: "info", dot: "bg-info" },
  running: { label: "En cours", variant: "success", dot: "bg-success" },
  contestation: { label: "Contestation", variant: "muted", dot: "bg-warning" },
  voting: { label: "Vote", variant: "warning", dot: "bg-warning" },
  appeal: { label: "Appel", variant: "warning", dot: "bg-warning" },
  finalized: {
    label: "Finalisé",
    variant: "muted",
    dot: "bg-muted-foreground",
  },
  cheated: {
    label: "Triche confirmée",
    variant: "muted",
    dot: "bg-destructive",
  },
} as const satisfies Record<
  CtfStatus,
  { label: string; variant: Variant; dot: string }
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

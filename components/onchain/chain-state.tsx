import { CircleAlertIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/** Lecture du contrat en cours. */
export function ChainLoading({
  label = "Lecture du contrat…",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <Empty className={cn("border border-dashed", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyDescription>{label}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** Le RPC n'a pas répondu ou le contrat a refusé la lecture. */
export function ChainError({
  error,
  className,
}: {
  error: Error
  className?: string
}) {
  return (
    <Empty className={cn("border border-dashed", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Lecture du contrat impossible</EmptyTitle>
        <EmptyDescription>
          Le réseau ne répond pas. Vérifie ta connexion, ou que le nœud local
          tourne (<code>pnpm chain</code>).
          <span className="mt-2 block font-mono text-xs break-all">
            {error.message.split("\n")[0]}
          </span>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

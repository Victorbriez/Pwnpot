"use client"

import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

/** « Publier un CTF » : la page arrive avec le contrat CTFPlatform. */
export function PublishCtfButton({
  variant = "default",
  size = "lg",
}: {
  variant?: "default" | "outline"
  size?: "default" | "lg"
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() =>
        toast("Publication bientôt disponible", {
          description:
            "Elle arrive avec le déploiement du contrat CTFPlatform.",
        })
      }
    >
      <PlusIcon data-icon="inline-start" />
      Publier un CTF
    </Button>
  )
}

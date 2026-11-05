import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

/** « Publier un CTF » : mène au formulaire de création. */
export function PublishCtfButton({
  variant = "default",
  size = "lg",
}: {
  variant?: "default" | "outline"
  size?: "default" | "lg"
}) {
  return (
    <Link href="/create" className={buttonVariants({ variant, size })}>
      <PlusIcon data-icon="inline-start" />
      Publier un CTF
    </Link>
  )
}

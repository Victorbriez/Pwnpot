import type { Metadata } from "next"
import Link from "next/link"

import { NotFoundTrace } from "@/components/status/not-found-trace"
import { StatusScreen } from "@/components/status/status-screen"
import { buttonVariants } from "@/components/ui/button"
import { TextLink } from "@/components/site/text-link"

export const metadata: Metadata = {
  title: "Page introuvable",
}

export default function NotFound() {
  return (
    <StatusScreen
      code="0x194"
      eyebrow="Erreur 404 · execution reverted"
      title="Rien à exploiter ici."
      description="Cette page n'a jamais été déployée. Comme tout revert, ça n'a rien modifié : ton wallet et la cagnotte sont exactement là où tu les as laissés."
      actions={
        <>
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/explore"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Explorer les CTF
          </Link>
        </>
      }
      hint={
        <>
          Tu cherchais une faille ?{" "}
          <TextLink href="/docs#epreuves">
            Les vraies sont dans les épreuves.
          </TextLink>
        </>
      }
      aside={<NotFoundTrace />}
    />
  )
}

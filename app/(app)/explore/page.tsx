import type { Metadata } from "next"
import Link from "next/link"

import { ExploreData } from "@/components/explore/explore-data"
import { PageHeader, PageShell } from "@/components/site/page-header"
import { PublishCtfButton } from "@/components/site/soon-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Explorer",
  description:
    "Tous les CTF smart contracts publiés sur Pwnpot : cagnottes, tickets et phases, lus directement dans le contrat.",
}

export default function ExplorePage() {
  return (
    <PageShell wide className="gap-10">
      <PageHeader
        meta={
          <Badge variant="success" className="h-6 gap-1.5 px-2.5">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Testnet Base Sepolia
          </Badge>
        }
        title="Explorer les CTF"
        description="Choisis un CTF, achète ton ticket et exploite tes instances. Chaque cagnotte est détenue par le contrat : personne ne peut la retirer en dehors des règles."
        actions={
          <>
            <Link
              href="/docs"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Comment ça marche
            </Link>
            <PublishCtfButton />
          </>
        }
      />

      <ExploreData />
    </PageShell>
  )
}

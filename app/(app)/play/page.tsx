import type { Metadata } from "next"
import Link from "next/link"

import { PlayView } from "@/components/my-ctfs/play-view"
import { PageHeader, PageShell } from "@/components/site/page-header"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Mes parties",
  description:
    "Les CTF auxquels tu participes : épreuves réussies, classement et ce qu'il te reste à faire.",
}

export default function PlayPage() {
  return (
    <PageShell>
      <PageHeader
        title="Mes parties"
        description="Les CTF où tu as un ticket : ta progression, ta place au classement et ce qu'il te reste à faire sur chacun."
        actions={
          <Link
            href="/explore"
            className={buttonVariants({ variant: "outline" })}
          >
            Trouver un CTF
          </Link>
        }
      />
      <PlayView />
    </PageShell>
  )
}

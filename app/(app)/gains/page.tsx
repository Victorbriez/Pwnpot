import type { Metadata } from "next"

import { GainsView } from "@/components/gains/gains-view"
import { PageHeader, PageShell } from "@/components/site/page-header"

export const metadata: Metadata = {
  title: "Mes gains",
  description:
    "Ce que la plateforme te doit, CTF par CTF, et le retrait en une transaction.",
}

export default function GainsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Mes gains"
        description="Rien ne t'est envoyé automatiquement : ce qu'on te doit reste dans le contrat jusqu'à ce que tu le retires."
      />
      <GainsView />
    </PageShell>
  )
}

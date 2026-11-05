import type { Metadata } from "next"

import { DisputeList } from "@/components/dispute/dispute-list"
import { PageHeader, PageShell } from "@/components/site/page-header"

export const metadata: Metadata = {
  title: "Litiges",
  description:
    "Les litiges en cours et les CTF encore contestables : vote des joueurs, appel et arbitre.",
}

export default function DisputesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Litiges"
        description="Après la fin d'un CTF, un détenteur de ticket a 48 h pour contester. Les joueurs votent pendant 48 h (1 adresse = 1 voix), puis le camp perdant a 24 h pour faire appel à l'arbitre."
      />
      <DisputeList />
    </PageShell>
  )
}

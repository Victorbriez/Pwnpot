import type { Metadata } from "next"

import { DisputeList } from "@/components/dispute/dispute-list"
import { PageHeader, PageShell } from "@/components/site/page-header"

export const metadata: Metadata = {
  title: "Litiges",
  description: "Les litiges chez l'arbitre et les CTF encore contestables.",
}

export default function DisputesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Litiges"
        description="Après la fin d'un CTF, un détenteur de ticket a 48 h pour contester. Le litige part directement à l'arbitre (ERC-792), dont la décision est définitive ; sans réponse sous 7 jours, il est rejeté."
      />
      <DisputeList />
    </PageShell>
  )
}

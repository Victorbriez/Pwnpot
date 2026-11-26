import type { Metadata } from "next"

import { DisputeList } from "@/components/dispute/dispute-list"
import { DisputePeriod } from "@/components/dispute/dispute-period"
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
        description={
          <>
            Après la fin d&apos;un CTF, un détenteur de ticket a{" "}
            <DisputePeriod of="contestation" /> pour contester. Le litige part
            directement à l&apos;arbitre (ERC-792), dont la décision est
            définitive ; sans réponse sous <DisputePeriod of="arbitrator" />, il
            est rejeté.
          </>
        }
      />
      <DisputeList />
    </PageShell>
  )
}

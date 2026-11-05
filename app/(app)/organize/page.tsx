import type { Metadata } from "next"

import { OrganizeView } from "@/components/my-ctfs/organize-view"
import { PageHeader, PageShell } from "@/components/site/page-header"
import { PublishCtfButton } from "@/components/site/soon-button"

export const metadata: Metadata = {
  title: "Mes CTF organisés",
  description:
    "Les CTF que tu as publiés : joueurs inscrits, cagnotte, caution et prochaine étape.",
}

export default function OrganizePage() {
  return (
    <PageShell>
      <PageHeader
        title="Mes CTF organisés"
        description="Les CTF que tu as publiés : joueurs inscrits, cagnotte, caution et ce qu'il te reste à faire sur chacun."
        actions={<PublishCtfButton size="default" />}
      />
      <OrganizeView />
    </PageShell>
  )
}

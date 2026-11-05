import type { Metadata } from "next"

import { MyCtfsView } from "@/components/my-ctfs/my-ctfs-view"
import { PageHeader, PageShell } from "@/components/site/page-header"
import { PublishCtfButton } from "@/components/site/soon-button"

export const metadata: Metadata = {
  title: "Mes CTF",
  description:
    "Les CTF auxquels tu participes et ceux que tu organises, avec ce qu'il te reste à faire.",
}

export default function MyCtfsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Mes CTF"
        description="Ce que tu joues, ce que tu organises, et ce qu'il te reste à faire sur chacun."
        actions={<PublishCtfButton variant="outline" size="default" />}
      />
      <MyCtfsView />
    </PageShell>
  )
}

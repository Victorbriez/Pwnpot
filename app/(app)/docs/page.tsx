import type { Metadata } from "next"

import { DocsContent } from "@/components/docs/docs-content"
import { docSections } from "@/components/docs/doc-section"
import { PageHeader, PageShell } from "@/components/site/page-header"
import { TocLayout } from "@/components/site/toc-layout"

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Toutes les règles de Pwnpot : jouer, organiser, où va l'argent, litiges et appel, épreuves, avec des exemples chiffrés.",
}

export default function DocsPage() {
  return (
    <PageShell wide>
      <PageHeader
        title="Comment ça marche"
        description="Toutes les règles de Pwnpot, avec des exemples chiffrés. Elles sont écrites dans le contrat : ce que tu lis ici, c'est ce qu'il applique."
      />
      <TocLayout sections={docSections}>
        <DocsContent />
      </TocLayout>
    </PageShell>
  )
}

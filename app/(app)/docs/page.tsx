import type { Metadata } from "next"

import { DocsContent } from "@/components/docs/docs-content"
import { docSections } from "@/components/docs/doc-section"
import { PageHeader, PageShell } from "@/components/site/page-header"
import { PageToc } from "@/components/site/page-toc"

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
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PageToc sections={docSections} />
        </aside>
        <DocsContent />
      </div>
    </PageShell>
  )
}

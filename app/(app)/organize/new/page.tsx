import type { Metadata } from "next"
import Link from "next/link"

import { CreateCtfForm } from "@/components/create/create-ctf-form"
import { PageHeader, PageShell } from "@/components/site/page-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: "Nouveau CTF",
  description:
    "Publie un CTF smart contracts : choisis tes épreuves, fixe la cagnotte et dépose ta caution.",
}

export default function NewCtfPage() {
  return (
    <PageShell>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/organize" />}>
                  Mes CTF organisés
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nouveau CTF</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title="Organiser un CTF"
        description="Le cash prize et ta caution restent bloqués dans le contrat jusqu'à la fin. Personne, toi compris, ne peut les retirer en dehors des règles."
      />
      <CreateCtfForm />
    </PageShell>
  )
}

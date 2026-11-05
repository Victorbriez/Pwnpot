import type { Metadata } from "next"

import { CreateCtfForm } from "@/components/create/create-ctf-form"
import { PageHeader, PageShell } from "@/components/site/page-header"

export const metadata: Metadata = {
  title: "Organiser un CTF",
  description:
    "Publie un CTF smart contracts : choisis tes épreuves, fixe la cagnotte et dépose ta caution.",
}

export default function CreatePage() {
  return (
    <PageShell>
      <PageHeader
        title="Organiser un CTF"
        description="Le cash prize et ta caution restent bloqués dans le contrat jusqu'à la fin. Personne, toi compris, ne peut les retirer en dehors des règles."
      />
      <CreateCtfForm />
    </PageShell>
  )
}

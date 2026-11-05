import type { Metadata } from "next"

import { DisputeList } from "@/components/dispute/dispute-list"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Litiges",
  description:
    "Les litiges en cours et les CTF encore contestables : vote des joueurs, appel et arbitre.",
}

export default function DisputesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-12">
      <header className="flex max-w-2xl flex-col gap-3">
        <Badge variant="warning" className="h-6 px-2.5">
          Données de démonstration
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Litiges
        </h1>
        <p className="text-pretty text-muted-foreground">
          Après la fin d&apos;un CTF, un détenteur de ticket a 48 h pour
          contester. Les joueurs votent pendant 48 h (1 adresse = 1 voix), puis
          le camp perdant a 24 h pour faire appel à l&apos;arbitre.
        </p>
      </header>
      <DisputeList />
    </div>
  )
}

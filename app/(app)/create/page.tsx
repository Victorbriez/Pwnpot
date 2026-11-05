import type { Metadata } from "next"

import { CreateCtfForm } from "@/components/create/create-ctf-form"

export const metadata: Metadata = {
  title: "Organiser un CTF",
  description:
    "Publie un CTF smart contracts : choisis tes épreuves, fixe la cagnotte et dépose ta caution.",
}

export default function CreatePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-12">
      <header className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Organiser un CTF
        </h1>
        <p className="text-pretty text-muted-foreground">
          Le cash prize et ta caution restent bloqués dans le contrat
          jusqu&apos;à la fin. Personne, toi compris, ne peut les retirer en
          dehors des règles.
        </p>
      </header>
      <CreateCtfForm />
    </div>
  )
}

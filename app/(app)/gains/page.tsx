import type { Metadata } from "next"

import { GainsView } from "@/components/gains/gains-view"

export const metadata: Metadata = {
  title: "Mes gains",
  description:
    "Ce que la plateforme te doit, CTF par CTF, et le retrait en une transaction.",
}

export default function GainsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-12">
      <header className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Mes gains
        </h1>
        <p className="text-pretty text-muted-foreground">
          Rien ne t&apos;est envoyé automatiquement : ce qu&apos;on te doit
          reste dans le contrat jusqu&apos;à ce que tu le retires.
        </p>
      </header>
      <GainsView />
    </div>
  )
}

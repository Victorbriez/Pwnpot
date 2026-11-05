import type { Metadata } from "next"

import { MyCtfsView } from "@/components/my-ctfs/my-ctfs-view"
import { PublishCtfButton } from "@/components/site/soon-button"

export const metadata: Metadata = {
  title: "Mes CTF",
  description:
    "Les CTF auxquels tu participes et ceux que tu organises, avec ce qu'il te reste à faire.",
}

export default function MyCtfsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Mes CTF
          </h1>
          <p className="text-pretty text-muted-foreground">
            Ce que tu joues, ce que tu organises, et ce qu&apos;il te reste à
            faire sur chacun.
          </p>
        </div>
        <PublishCtfButton variant="outline" size="default" />
      </header>
      <MyCtfsView />
    </div>
  )
}

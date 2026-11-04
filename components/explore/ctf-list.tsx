"use client"

import { SearchXIcon } from "lucide-react"
import * as React from "react"

import { CtfCard } from "@/components/ctf/ctf-card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { isClosed, type Ctf } from "@/lib/mock/explore"

const filters = {
  all: { label: "Tous", test: () => true },
  active: { label: "Actifs", test: (ctf: Ctf) => !isClosed(ctf.status) },
  beginner: { label: "Débutant", test: (ctf: Ctf) => ctf.level === "beginner" },
  advanced: { label: "Avancé", test: (ctf: Ctf) => ctf.level === "advanced" },
  soon: {
    label: "Bientôt finis",
    test: (ctf: Ctf) => ctf.status === "running" && ctf.remaining < 86_400,
  },
} as const
type Filter = keyof typeof filters

export function CtfList({ ctfs }: { ctfs: Ctf[] }) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const visible = ctfs.filter(filters[filter].test)

  return (
    <section aria-labelledby="live-ctfs" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="live-ctfs" className="text-xl font-semibold tracking-tight">
          Tous les CTF
        </h2>
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          value={[filter]}
          onValueChange={(value) => {
            const next = value[0] as Filter | undefined
            if (next) setFilter(next)
          }}
          aria-label="Filtrer les CTF"
          className="flex-wrap"
        >
          {Object.entries(filters).map(([key, { label }]) => (
            <ToggleGroupItem key={key} value={key}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {visible.length > 0 ? (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ctf) => (
            <li key={ctf.id} className="contents">
              <CtfCard ctf={ctf} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Aucun CTF pour ce filtre</EmptyTitle>
            <EmptyDescription>
              Essaie un autre filtre ou affiche tout.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter("all")}
            >
              Voir tous les CTF
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </section>
  )
}

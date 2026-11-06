"use client"

import { ChevronRightIcon, SearchXIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { remainingLabel } from "@/components/ctf/ctf-card"
import { StatusPill } from "@/components/ctf/status-pill"
import { VulnTag } from "@/components/ctf/vuln-tag"
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
import { SectionHeading } from "@/components/site/page-header"
import { cn } from "@/lib/utils"
import { formatEth, formatInt } from "@/lib/format"
import { isClosed, type Ctf, type CtfStatus } from "@/lib/ctf/types"
import { truncateAddress } from "@/lib/onchain/format"

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

/** Ordre de la liste : ce qu'on peut jouer d'abord, puis ce qui se termine. */
const phaseOrder: Record<CtfStatus, number> = {
  running: 0,
  open: 1,
  contestation: 2,
  voting: 2,
  appeal: 2,
  finalized: 3,
  cheated: 3,
}

function byRelevance(a: Ctf, b: Ctf) {
  const phase = phaseOrder[a.status] - phaseOrder[b.status]
  if (phase !== 0) return phase
  // Dans une même phase, la fin la plus proche d'abord (le plus récent si clos).
  return isClosed(a.status) ? b.id - a.id : a.remaining - b.remaining
}

const columns =
  "md:grid-cols-[9.5rem_minmax(0,1fr)_7.5rem_6.5rem_7rem_1rem] md:gap-6"

export function CtfList({ ctfs }: { ctfs: Ctf[] }) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const visible = ctfs.filter(filters[filter].test).sort(byRelevance)
  // Le niveau n'existe qu'en démo : le contrat ne le stocke pas.
  const hasLevels = ctfs.some((ctf) => ctf.level !== undefined)
  const shown = Object.entries(filters).filter(
    ([key]) => hasLevels || (key !== "beginner" && key !== "advanced")
  )

  return (
    <section aria-labelledby="live-ctfs" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeading id="live-ctfs">Tous les CTF</SectionHeading>
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
          {shown.map(([key, { label }]) => (
            <ToggleGroupItem key={key} value={key}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {visible.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div
            aria-hidden
            className={cn(
              "hidden border-b px-5 py-2.5 text-xs text-muted-foreground md:grid",
              columns
            )}
          >
            <span>Phase</span>
            <span>CTF</span>
            <span className="text-right">Cagnotte</span>
            <span className="text-right">Ticket</span>
            <span>Joueurs</span>
            <span />
          </div>
          <ul className="divide-y">
            {visible.map((ctf) => (
              <li key={ctf.id}>
                <CtfRow ctf={ctf} />
              </li>
            ))}
          </ul>
        </div>
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

function CtfRow({ ctf }: { ctf: Ctf }) {
  const full = ctf.players >= ctf.maxPlayers
  return (
    <Link
      href={`/ctf/${ctf.id}`}
      className={cn(
        "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-5",
        columns
      )}
    >
      <div className="col-span-2 flex items-center gap-2.5 md:col-span-1 md:flex-col md:items-start md:gap-1.5">
        <StatusPill status={ctf.status} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {remainingLabel(ctf)}
        </span>
      </div>

      <div className="col-span-2 flex min-w-0 flex-col gap-1.5 md:col-span-1">
        <span className="truncate font-medium group-hover:text-primary-text">
          {ctf.title}
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
          <span>
            {ctf.challenges} épreuve{ctf.challenges > 1 ? "s" : ""} · par{" "}
            <span className="font-mono">
              {truncateAddress(ctf.organizer, 3)}
            </span>
          </span>
          {ctf.vulns.map((vuln) => (
            <VulnTag key={vuln} vuln={vuln} />
          ))}
        </div>
      </div>

      <dl className="col-span-2 grid grid-cols-3 gap-4 md:contents">
        <div className="flex flex-col gap-0.5 md:items-end">
          <dt className="text-xs text-muted-foreground md:sr-only">Cagnotte</dt>
          <dd className="text-base font-semibold tabular-nums md:text-right">
            {formatEth(ctf.prizePool)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 md:items-end">
          <dt className="text-xs text-muted-foreground md:sr-only">Ticket</dt>
          <dd className="text-sm tabular-nums md:text-right">
            {formatEth(ctf.ticketPrice)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground md:sr-only">Joueurs</dt>
          <dd className="flex flex-col gap-1.5">
            <span className="text-sm tabular-nums">
              {formatInt(ctf.players)} / {formatInt(ctf.maxPlayers)}
              {full && (
                <span className="text-muted-foreground"> · complet</span>
              )}
            </span>
            <span
              aria-hidden
              className="h-1 w-full overflow-hidden rounded-full bg-muted"
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min((ctf.players / ctf.maxPlayers) * 100, 100)}%`,
                }}
              />
            </span>
          </dd>
        </div>
      </dl>

      <ChevronRightIcon
        aria-hidden
        className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block"
      />
    </Link>
  )
}

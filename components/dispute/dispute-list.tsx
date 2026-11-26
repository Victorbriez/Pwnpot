"use client"

import Link from "next/link"
import { ScaleIcon } from "lucide-react"

import { StatusPill } from "@/components/ctf/status-pill"
import { Badge } from "@/components/ui/badge"
import { SectionHeading } from "@/components/site/page-header"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { ChainError, ChainLoading } from "@/components/onchain/chain-state"
import { useCtfs } from "@/hooks/use-ctfs"
import { contestBond } from "@/lib/ctf/dispute"
import type { Ctf } from "@/lib/ctf/types"
import { formatEth, formatRemaining } from "@/lib/format"
import { truncateAddress } from "@/lib/onchain/format"

type Row = Ctf

/** Litiges chez l'arbitre et CTF encore contestables, lus avec `useCtfs`. */
export function DisputeList() {
  const { ctfs, isLoading, error } = useCtfs()
  if (error) return <ChainError error={error} />
  if (isLoading) return <ChainLoading />

  const inProgress = ctfs.filter((ctf) => ctf.status === "appeal")
  // Fenêtre encore ouverte : passé ce délai, on ne peut plus que finaliser.
  const contestable = ctfs.filter(
    (ctf) => ctf.status === "contestation" && ctf.remaining > 0
  )

  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Litiges chez l'arbitre"
        empty="Aucun litige en cours."
        rows={inProgress}
        describe={(ctf) => {
          const contester = ctf.chain?.dispute?.contester
          return (
            <>
              <ItemDescription className="tabular-nums">
                {contester
                  ? `Contesté par ${truncateAddress(contester)}`
                  : "Contesté par un joueur"}{" "}
                · l&apos;arbitre tranche
              </ItemDescription>
              <ItemActions>
                <Badge variant="muted">
                  {ctf.remaining > 0
                    ? `timeout dans ${formatRemaining(ctf.remaining)}`
                    : "timeout atteint"}
                </Badge>
              </ItemActions>
            </>
          )
        }}
      />
      <Section
        title="Encore contestables"
        empty="Aucun CTF dans sa fenêtre de contestation."
        rows={contestable}
        describe={(ctf) => (
          <>
            <ItemDescription className="tabular-nums">
              Caution de contestation {formatEth(contestBond(ctf.ticketPrice))}{" "}
              + frais de l&apos;arbitre
            </ItemDescription>
            <ItemActions>
              <Badge variant="muted">
                reste {formatRemaining(ctf.remaining)}
              </Badge>
            </ItemActions>
          </>
        )}
      />
    </div>
  )
}

function Section({
  title,
  empty,
  rows,
  describe,
}: {
  title: string
  empty: string
  rows: Row[]
  describe: (row: Row) => React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading count={rows.length}>{title}</SectionHeading>
      {rows.length > 0 ? (
        <ItemGroup className="gap-3">
          {rows.map((row) => (
            <Item
              key={row.id}
              variant="outline"
              className="gap-x-6 gap-y-3 rounded-xl p-4"
              render={<Link href={`/ctf/${row.id}`} />}
            >
              <ItemContent className="min-w-48">
                <ItemTitle className="text-base">{row.title}</ItemTitle>
                <ItemDescription>
                  <StatusPill status={row.status} />
                </ItemDescription>
              </ItemContent>
              {describe(row)}
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <Empty className="rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScaleIcon />
            </EmptyMedia>
            <EmptyTitle>{empty}</EmptyTitle>
            <EmptyDescription>
              Les CTF terminés apparaissent ici pendant 48 h.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  )
}

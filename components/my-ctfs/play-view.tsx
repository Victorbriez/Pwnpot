"use client"

import Link from "next/link"
import { SwordsIcon } from "lucide-react"

import { StatusPill } from "@/components/ctf/status-pill"
import { KpiCard } from "@/components/explore/kpi-card"
import {
  EmptyList,
  NextStepBadge,
  WalletGate,
} from "@/components/my-ctfs/shared"
import { buttonVariants } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { SectionHeading } from "@/components/site/page-header"
import { useMyCtfs } from "@/hooks/use-my-ctfs"
import { playerNextStep } from "@/lib/ctf/next-step"
import { formatEth, formatInt } from "@/lib/format"
import type { MyParticipation } from "@/lib/ctf/types"

function rankLabel(rank: number) {
  return rank === 1 ? "1er" : `${rank}e`
}

/** Les CTF où l'adresse connectée a un ticket. */
export function PlayView() {
  const { playing, playingTotals: totals, needsWallet } = useMyCtfs()

  if (needsWallet) return <WalletGate />

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-label="Résumé"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
      >
        <KpiCard
          label="Parties en cours"
          value={formatInt(totals.active)}
          caption="CTF pas encore réglés"
        />
        <KpiCard
          label="Épreuves réussies"
          value={formatInt(totals.solved)}
          caption="tous CTF confondus"
        />
        <KpiCard
          label="Gains à retirer"
          className="col-span-2 sm:col-span-1"
          value={formatEth(totals.owed)}
          caption="gains et remboursements de tickets"
          action={
            <Link
              href="/gains"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Mes gains
            </Link>
          }
        />
      </section>

      <section aria-labelledby="parties-titre" className="flex flex-col gap-4">
        <SectionHeading id="parties-titre" count={playing.length}>
          Mes parties
        </SectionHeading>
        {playing.length > 0 ? (
          <ItemGroup className="gap-3">
            {playing.map((p) => (
              <PlayingItem key={p.ctf.id} participation={p} />
            ))}
          </ItemGroup>
        ) : (
          <EmptyList
            icon={<SwordsIcon />}
            title="Tu ne joues à aucun CTF"
            description="Achète un ticket pour apparaître ici."
            href="/explore"
            cta="Explorer les CTF"
          />
        )}
      </section>
    </div>
  )
}

function PlayingItem({ participation: p }: { participation: MyParticipation }) {
  const step = playerNextStep(p)
  return (
    <Item
      variant="outline"
      className="gap-x-6 gap-y-3 rounded-xl p-4"
      render={<Link href={`/ctf/${p.ctf.id}`} />}
    >
      <ItemContent className="min-w-48">
        <ItemTitle className="text-base">{p.ctf.title}</ItemTitle>
        <ItemDescription>
          <StatusPill status={p.ctf.status} />
        </ItemDescription>
      </ItemContent>
      <ItemContent className="w-full flex-none sm:w-56">
        <Progress
          value={(p.solved / p.ctf.challenges) * 100}
          aria-label="Épreuves réussies"
        />
        <ItemDescription className="flex justify-between gap-3 whitespace-nowrap tabular-nums">
          <span>
            {p.solved} / {p.ctf.challenges} épreuve
            {p.ctf.challenges > 1 ? "s" : ""}
          </span>
          <span>
            {p.rank !== null
              ? `${rankLabel(p.rank)} sur ${formatInt(p.ctf.players)}`
              : "non classé"}
          </span>
        </ItemDescription>
      </ItemContent>
      <ItemActions className="sm:ml-auto sm:w-64 sm:justify-end">
        <NextStepBadge step={step} />
      </ItemActions>
    </Item>
  )
}

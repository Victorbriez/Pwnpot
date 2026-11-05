"use client"

import Link from "next/link"
import { FlagIcon } from "lucide-react"

import { StatusPill } from "@/components/ctf/status-pill"
import { KpiCard } from "@/components/explore/kpi-card"
import {
  EmptyList,
  NextStepBadge,
  WalletGate,
} from "@/components/my-ctfs/shared"
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
import { organizerNextStep } from "@/lib/ctf/next-step"
import { formatEth, formatInt } from "@/lib/format"
import type { MyOrganized } from "@/lib/ctf/types"

/** Les CTF publiés par l'adresse connectée. */
export function OrganizeView() {
  const { organizing, organizingTotals: totals, needsWallet } = useMyCtfs()

  if (needsWallet) return <WalletGate />

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-label="Résumé"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
      >
        <KpiCard
          label="CTF en cours"
          value={formatInt(totals.active)}
          caption="pas encore réglés"
        />
        <KpiCard
          label="Joueurs inscrits"
          value={formatInt(totals.players)}
          caption="tous tes CTF confondus"
        />
        <KpiCard
          label="Bloqué dans le contrat"
          className="col-span-2 sm:col-span-1"
          value={formatEth(totals.locked)}
          caption="cagnottes et cautions en cours"
        />
      </section>

      <section
        aria-labelledby="organises-titre"
        className="flex flex-col gap-4"
      >
        <SectionHeading id="organises-titre" count={organizing.length}>
          Mes CTF organisés
        </SectionHeading>
        {organizing.length > 0 ? (
          <ItemGroup className="gap-3">
            {organizing.map((o) => (
              <OrganizedItem key={o.ctf.id} organized={o} />
            ))}
          </ItemGroup>
        ) : (
          <EmptyList
            icon={<FlagIcon />}
            title="Tu n'organises aucun CTF"
            description="Publie ton premier CTF en quelques minutes."
            href="/organize/new"
            cta="Créer un CTF"
          />
        )}
      </section>
    </div>
  )
}

function OrganizedItem({ organized: o }: { organized: MyOrganized }) {
  const step = organizerNextStep(o)
  const { ctf } = o
  return (
    <Item
      variant="outline"
      className="gap-x-6 gap-y-3 rounded-xl p-4"
      render={<Link href={`/ctf/${ctf.id}`} />}
    >
      <ItemContent className="min-w-48">
        <ItemTitle className="text-base">{ctf.title}</ItemTitle>
        <ItemDescription>
          <StatusPill status={ctf.status} />
        </ItemDescription>
      </ItemContent>
      <ItemContent className="w-full flex-none sm:w-56">
        <Progress
          value={(ctf.players / ctf.maxPlayers) * 100}
          aria-label="Places vendues"
        />
        <ItemDescription className="tabular-nums">
          {formatInt(ctf.players)} / {formatInt(ctf.maxPlayers)} joueurs
        </ItemDescription>
      </ItemContent>
      <ItemContent className="flex-none">
        <ItemDescription className="tabular-nums">
          Cagnotte{" "}
          <span className="font-medium text-foreground">
            {formatEth(ctf.prizePool)}
          </span>
        </ItemDescription>
        <ItemDescription className="tabular-nums">
          Caution{" "}
          <span className="font-medium text-foreground">
            {formatEth(ctf.bond)}
          </span>
        </ItemDescription>
      </ItemContent>
      <ItemActions className="sm:ml-auto sm:w-64 sm:justify-end">
        <NextStepBadge step={step} />
      </ItemActions>
    </Item>
  )
}

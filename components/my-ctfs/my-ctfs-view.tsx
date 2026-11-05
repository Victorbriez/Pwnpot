"use client"

import Link from "next/link"
import { FlagIcon, SwordsIcon, WalletIcon } from "lucide-react"

import { StatusPill } from "@/components/ctf/status-pill"
import { KpiCard } from "@/components/explore/kpi-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import {
  Empty,
  EmptyContent,
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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMyCtfs } from "@/hooks/use-my-ctfs"
import {
  organizerNextStep,
  playerNextStep,
  type NextStep,
} from "@/lib/ctf/next-step"
import { formatEth, formatInt } from "@/lib/format"
import type { MyOrganized, MyParticipation } from "@/lib/mock/my-ctfs"

const toneVariant = {
  neutral: "muted",
  action: "brand",
  warning: "warning",
  money: "success",
} as const satisfies Record<NextStep["tone"], string>

function rankLabel(rank: number) {
  return rank === 1 ? "1er" : `${rank}e`
}

export function MyCtfsView() {
  const { playing, organizing, totals, isDemo, needsWallet } = useMyCtfs()

  if (needsWallet) {
    return (
      <Empty className="rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletIcon />
          </EmptyMedia>
          <EmptyTitle>Connecte ton wallet</EmptyTitle>
          <EmptyDescription>
            Tes CTF sont lus depuis la chaîne, à partir de ton adresse.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ConnectWallet />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {isDemo && (
        <Badge variant="warning" className="h-6 px-2.5">
          Données de démonstration
        </Badge>
      )}

      <section aria-label="Résumé" className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="CTF en cours"
          value={formatInt(totals.active)}
          caption="joués ou organisés"
        />
        <KpiCard
          label="Épreuves réussies"
          value={formatInt(totals.solved)}
          caption="tous CTF confondus"
        />
        <KpiCard
          label="À retirer"
          value={formatEth(totals.owed)}
          caption="gains, remboursements et cautions"
        />
      </section>

      <Tabs defaultValue="playing">
        <TabsList>
          <TabsTrigger value="playing">
            Je participe
            <Badge variant="muted">{playing.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="organizing">
            J&apos;organise
            <Badge variant="muted">{organizing.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playing" className="pt-2">
          {playing.length > 0 ? (
            <ItemGroup className="gap-3">
              {playing.map((p) => (
                <PlayingItem key={p.ctf.id} participation={p} />
              ))}
            </ItemGroup>
          ) : (
            <EmptyTab
              icon={<SwordsIcon />}
              title="Tu ne joues à aucun CTF"
              description="Achète un ticket pour apparaître ici."
              href="/explore"
              cta="Explorer les CTF"
            />
          )}
        </TabsContent>

        <TabsContent value="organizing" className="pt-2">
          {organizing.length > 0 ? (
            <ItemGroup className="gap-3">
              {organizing.map((o) => (
                <OrganizedItem key={o.ctf.id} organized={o} />
              ))}
            </ItemGroup>
          ) : (
            <EmptyTab
              icon={<FlagIcon />}
              title="Tu n'organises aucun CTF"
              description="Publie ton premier CTF en quelques minutes."
              href="/create"
              cta="Organiser un CTF"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PlayingItem({ participation: p }: { participation: MyParticipation }) {
  const step = playerNextStep(p)
  return (
    <Item variant="outline" className="gap-x-6 gap-y-3 rounded-xl p-4">
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

function OrganizedItem({ organized: o }: { organized: MyOrganized }) {
  const step = organizerNextStep(o)
  const { ctf } = o
  return (
    <Item variant="outline" className="gap-x-6 gap-y-3 rounded-xl p-4">
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

function NextStepBadge({ step }: { step: NextStep }) {
  return (
    <Badge variant={toneVariant[step.tone]} className="h-7 px-3">
      {step.label}
    </Badge>
  )
}

function EmptyTab({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Empty className="rounded-2xl border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href={href} className={buttonVariants({ variant: "outline" })}>
          {cta}
        </Link>
      </EmptyContent>
    </Empty>
  )
}

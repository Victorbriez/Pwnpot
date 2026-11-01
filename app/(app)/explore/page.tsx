import type { Metadata } from "next"
import Link from "next/link"

import { CtfList } from "@/components/explore/ctf-list"
import { KpiCard } from "@/components/explore/kpi-card"
import { TvlChart } from "@/components/explore/tvl-chart"
import { VulnDonut } from "@/components/explore/vuln-donut"
import { PublishCtfButton } from "@/components/site/soon-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { formatEth, formatInt, formatTrend } from "@/lib/format"
import { ctfs, kpis } from "@/lib/mock/explore"

export const metadata: Metadata = {
  title: "Explorer",
}

export default function ExplorePage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" className="h-6 gap-1.5 px-2.5">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              Testnet Base Sepolia
            </Badge>
            <Badge variant="muted" className="h-6 px-2.5">
              Contrats vérifiés sur Basescan
            </Badge>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            CTF smart contracts, cagnottes garanties on-chain
          </h1>
          <p className="max-w-xl text-pretty text-muted-foreground">
            Exploite des contrats vulnérables. La cagnotte est détenue par le
            contrat : personne ne peut la retirer en dehors des règles.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/#comment-ca-marche"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Comment ça marche
          </Link>
          <PublishCtfButton />
        </div>
      </header>

      <section
        aria-label="Chiffres clés"
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Cagnottes bloquées"
          value={formatEth(kpis.lockedPrizePools)}
          caption={`sur ${kpis.activeCtfs} CTF actifs`}
          trend={formatTrend(kpis.trends.locked)}
        />
        <KpiCard
          label="Joueurs actifs"
          value={formatInt(kpis.activePlayers)}
          caption="tickets achetés cette semaine"
          trend={formatTrend(kpis.trends.players)}
        />
        <KpiCard
          label="Épreuves résolues"
          value={formatInt(kpis.solved)}
          caption="vérifiées par validateInstance"
          trend={formatTrend(kpis.trends.solved)}
        />
        <KpiCard
          label="Cautions en jeu"
          value={formatEth(kpis.bondsAtStake)}
          caption="déposées par les organisateurs"
          trend={`${kpis.openDisputes} litiges`}
          trendVariant="warning"
        />
      </section>

      <section
        aria-label="Statistiques"
        className="grid gap-6 lg:grid-cols-[2fr_1fr]"
      >
        <TvlChart />
        <VulnDonut />
      </section>

      <CtfList ctfs={ctfs} />
    </div>
  )
}

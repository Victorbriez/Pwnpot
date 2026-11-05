"use client"

import { CtfList } from "@/components/explore/ctf-list"
import { KpiCard } from "@/components/explore/kpi-card"
import { TvlChart } from "@/components/explore/tvl-chart"
import { VulnDonut } from "@/components/explore/vuln-donut"
import { ChainError, ChainLoading } from "@/components/onchain/chain-state"
import { useCtfs } from "@/hooks/use-ctfs"
import { usePlatformEvents } from "@/hooks/use-platform-events"
import { formatEth, formatInt, formatTrend } from "@/lib/format"
import { computeKpis } from "@/lib/ctf/kpis"
import { kpis as demoKpis } from "@/lib/mock/explore"

/**
 * Chiffres clés et liste des CTF. En démo, les mocks avec leurs tendances et
 * leurs graphiques ; avec le contrat, l'état réel, sans historique (#33).
 */
export function ExploreData() {
  const { ctfs, isLoading, error, isDemo } = useCtfs()
  const solves = usePlatformEvents("LevelSolved")

  if (error) return <ChainError error={error} />
  if (isLoading) return <ChainLoading />

  const kpis = isDemo ? demoKpis : computeKpis(ctfs, solves.data?.length)
  const trends = isDemo ? demoKpis.trends : undefined
  const disputes = `${kpis.openDisputes} litige${kpis.openDisputes > 1 ? "s" : ""} ouvert${kpis.openDisputes > 1 ? "s" : ""}`

  return (
    <>
      <section
        aria-label="Chiffres clés"
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Cagnottes bloquées"
          value={formatEth(kpis.lockedPrizePools)}
          caption={`sur ${kpis.activeCtfs} CTF actif${kpis.activeCtfs > 1 ? "s" : ""}`}
          trend={trends && formatTrend(trends.locked)}
        />
        <KpiCard
          label="Joueurs actifs"
          value={formatInt(kpis.activePlayers)}
          caption="tickets achetés sur les CTF actifs"
          trend={trends && formatTrend(trends.players)}
        />
        <KpiCard
          label="Épreuves résolues"
          value={kpis.solved !== undefined ? formatInt(kpis.solved) : "—"}
          caption="vérifiées par validateInstance"
          trend={trends && formatTrend(trends.solved)}
        />
        <KpiCard
          label="Cautions en jeu"
          value={formatEth(kpis.bondsAtStake)}
          caption="déposées par les organisateurs, brûlées en cas de triche"
          trend={isDemo ? disputes : undefined}
          trendVariant="warning"
        />
      </section>

      {isDemo && (
        <section
          aria-label="Statistiques"
          className="grid gap-6 lg:grid-cols-[2fr_1fr]"
        >
          <TvlChart />
          <VulnDonut />
        </section>
      )}

      <CtfList ctfs={ctfs} />
    </>
  )
}

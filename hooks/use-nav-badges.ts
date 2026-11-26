"use client"

import type { NavBadge } from "@/components/site/nav-links"
import { useCtfs } from "@/hooks/use-ctfs"
import { useMyCtfs } from "@/hooks/use-my-ctfs"
import { inDispute } from "@/lib/ctf/types"
import { formatEth } from "@/lib/format"

export type NavBadgeInfo = {
  label: string
  /** Texte lu par les lecteurs d'écran. */
  srLabel: string
  variant: "secondary" | "warning"
}

/** Pastilles de « Mon espace » : solde à retirer et litiges en cours. */
export function useNavBadges(): Partial<Record<NavBadge, NavBadgeInfo>> {
  const { totals } = useMyCtfs()
  // Litiges ouverts (chez l'arbitre), lus dans le contrat ou les mocks.
  const { ctfs } = useCtfs()
  const disputesInProgress = ctfs.filter((ctf) => inDispute(ctf.status)).length
  const badges: Partial<Record<NavBadge, NavBadgeInfo>> = {}

  if (totals.owed > BigInt(0)) {
    const amount = formatEth(totals.owed)
    badges.owed = {
      label: amount,
      srLabel: `${amount} à retirer`,
      variant: "secondary",
    }
  }
  if (disputesInProgress > 0) {
    badges.disputes = {
      label: String(disputesInProgress),
      srLabel: `${disputesInProgress} litige${disputesInProgress > 1 ? "s" : ""} en cours`,
      variant: "warning",
    }
  }
  return badges
}

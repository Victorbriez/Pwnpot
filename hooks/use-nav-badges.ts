"use client"

import type { NavBadge } from "@/components/site/nav-links"
import { useMyCtfs } from "@/hooks/use-my-ctfs"
import { formatEth } from "@/lib/format"
import { disputeRows, isDisputeInProgress } from "@/lib/mock/disputes"
import { ctfs } from "@/lib/mock/explore"

// Mocks : calculé une fois. Avec le contrat, viendra des events DisputeOpened.
const disputesInProgress = disputeRows(ctfs).filter(isDisputeInProgress).length

export type NavBadgeInfo = {
  label: string
  /** Texte lu par les lecteurs d'écran. */
  srLabel: string
  variant: "secondary" | "warning"
}

/** Pastilles de « Mon espace » : solde à retirer et litiges en cours. */
export function useNavBadges(): Partial<Record<NavBadge, NavBadgeInfo>> {
  const { totals } = useMyCtfs()
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

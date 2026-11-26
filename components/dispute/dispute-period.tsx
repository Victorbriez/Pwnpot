"use client"

import { useDisputePeriods } from "@/hooks/use-dispute-periods"
import { formatPeriod } from "@/lib/format"

/**
 * Durée d'une règle de litige lue dans le contrat (« 48 h », « 10 min » en
 * démo), pour l'écrire dans un texte rendu côté serveur.
 */
export function DisputePeriod({ of }: { of: "contestation" | "arbitrator" }) {
  const periods = useDisputePeriods()
  return <>{formatPeriod(periods[of])}</>
}

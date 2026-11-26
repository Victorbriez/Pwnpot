import { formatEther } from "viem"

// Jusqu'à quatre décimales : sur testnet les montants sont petits, et deux
// décimales afficheraient « 0,01 ETH » pour une cagnotte de 0,013 ETH.
// Les zéros en trop sont retirés au-delà de deux (« 0,50 », « 0,013 »).
const ethFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const intFormatter = new Intl.NumberFormat("fr-FR")

/** Montant en wei vers « 6,84 ETH » ou « 0,013 ETH ». Le bigint reste intact jusqu'ici. */
export function formatEth(wei: bigint, { unit = true } = {}): string {
  const value = ethFormatter.format(Number(formatEther(wei)))
  return unit ? `${value} ETH` : value
}

export function formatInt(value: number): string {
  return intFormatter.format(value)
}

const pctFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})

/** 12.4 vers « +12,4 % ». */
export function formatTrend(value: number): string {
  return `${pctFormatter.format(value)} %`
}

/** Durée restante en secondes vers « 2 j 14 h » ou « 18 h 05 min ». */
export function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "terminé"
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  // Les unités à zéro sont omises : « 7 j » plutôt que « 7 j 0 h ».
  if (days > 0) return hours > 0 ? `${days} j ${hours} h` : `${days} j`
  if (hours > 0)
    return minutes > 0
      ? `${hours} h ${String(minutes).padStart(2, "0")} min`
      : `${hours} h`
  return `${minutes} min`
}

/**
 * Durée fixe d'une règle vers « 48 h », « 7 j » ou « 10 min » : en heures
 * jusqu'à 2 jours (comme la doc), en jours au-delà.
 */
export function formatPeriod(seconds: number): string {
  if (seconds > 2 * 86_400 && seconds % 86_400 === 0)
    return `${seconds / 86_400} j`
  if (seconds >= 3_600 && seconds % 3_600 === 0) return `${seconds / 3_600} h`
  return formatRemaining(seconds)
}

/** Compte à rebours d'un badge : « reste 2 j 14 h », puis « terminé » à zéro. */
export function formatTimeLeft(seconds: number): string {
  return seconds > 0 ? `reste ${formatRemaining(seconds)}` : "terminé"
}

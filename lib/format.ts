import { formatEther } from "viem"

const ethFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Sous 0,01 ETH, deux décimales afficheraient « 0,00 » : on en garde jusqu'à quatre.
const smallEthFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const intFormatter = new Intl.NumberFormat("fr-FR")

/** Montant en wei vers « 6,84 ETH ». Le bigint reste intact jusqu'ici. */
export function formatEth(wei: bigint, { unit = true } = {}): string {
  const amount = Number(formatEther(wei))
  const formatter =
    amount !== 0 && Math.abs(amount) < 0.01 ? smallEthFormatter : ethFormatter
  const value = formatter.format(amount)
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
  if (days > 0) return `${days} j ${hours} h`
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")} min`
  return `${minutes} min`
}

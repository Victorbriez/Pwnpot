// Règles de création d'un CTF, identiques à celles du contrat (docs/DESIGN.md,
// § Paramètres). Le formulaire les vérifie avant l'envoi ; le contrat reste
// la référence et refuse de toute façon une valeur hors bornes.
import { parseEther, type Address } from "viem"

export const MIN_TICKET_PRICE = parseEther("0.0001")
export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 200

/** Durées proposées, toutes dans les bornes du contrat (1 h à 30 jours). */
export const DURATION_DAYS = [1, 3, 7, 14, 30] as const
export type DurationDays = (typeof DURATION_DAYS)[number]

/** Paramètres envoyés à `createCTF`, en wei et en secondes. */
export type CtfParams = {
  cashPrize: bigint
  ticketPrice: bigint
  maxPlayers: number
  organizerBond: bigint
  startTime: bigint
  endTime: bigint
}

/** Ce que l'utilisateur a saisi. */
export type CtfDraft = {
  factories: Address[]
  cashPrize: string
  ticketPrice: string
  maxPlayers: string
  /** Date et heure de début, en heure locale. */
  start: Date | undefined
  durationDays: DurationDays
}

export type CtfField =
  "factories" | "cashPrize" | "ticketPrice" | "maxPlayers" | "start"

export type CtfValidation = {
  params?: CtfParams
  factories: Address[]
  errors: Partial<Record<CtfField, string>>
  /** Caution, connue dès que cash prize, ticket et joueurs sont valides. */
  bond?: bigint
  /** Fin du CTF, connue dès que le début est choisi. */
  end?: Date
}

/**
 * Caution de l'organisateur : ce qu'un organisateur tricheur pourrait
 * récupérer au mieux. Le formulaire dépose toujours ce minimum.
 */
export function minBond(
  cashPrize: bigint,
  ticketPrice: bigint,
  maxPlayers: number
): bigint {
  return cashPrize + BigInt(maxPlayers) * ticketPrice
}

/** Montant à envoyer avec `createCTF` : cash prize + caution. */
export function totalValue(
  params: Pick<CtfParams, "cashPrize" | "organizerBond">
) {
  return params.cashPrize + params.organizerBond
}

/** « 0,5 » ou « 0.5 » vers des wei ; `null` si ce n'est pas un montant. */
export function parseEth(value: string): bigint | null {
  const normalized = value.trim().replace(",", ".")
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  try {
    return parseEther(normalized)
  } catch {
    return null
  }
}

function amountError(value: string) {
  return value.trim() === "" ? "Montant requis." : "Montant invalide."
}

/** Heure courante, en secondes Unix. */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Vérifie la saisie. `now` (secondes) n'est passé qu'au moment de l'envoi,
 * pour refuser un début déjà passé sans dépendre de l'heure pendant le rendu.
 */
export function validateCtfDraft(
  draft: CtfDraft,
  { now }: { now?: number } = {}
): CtfValidation {
  const errors: CtfValidation["errors"] = {}

  const factories = draft.factories
  if (factories.length === 0) {
    errors.factories = "Choisis au moins une épreuve."
  } else if (
    new Set(factories.map((f) => f.toLowerCase())).size !== factories.length
  ) {
    errors.factories = "La même factory est choisie deux fois."
  }

  const cashPrize = parseEth(draft.cashPrize)
  if (cashPrize === null) errors.cashPrize = amountError(draft.cashPrize)
  else if (cashPrize === BigInt(0))
    errors.cashPrize = "Le cash prize doit être supérieur à 0."

  const ticketPrice = parseEth(draft.ticketPrice)
  if (ticketPrice === null) errors.ticketPrice = amountError(draft.ticketPrice)
  else if (ticketPrice < MIN_TICKET_PRICE)
    errors.ticketPrice = "Le ticket coûte au moins 0,0001 ETH."

  const maxPlayers = Number(draft.maxPlayers)
  const playersOk =
    draft.maxPlayers.trim() !== "" &&
    Number.isInteger(maxPlayers) &&
    maxPlayers >= MIN_PLAYERS &&
    maxPlayers <= MAX_PLAYERS
  if (!playersOk)
    errors.maxPlayers = `Entre ${MIN_PLAYERS} et ${MAX_PLAYERS} joueurs.`

  const bond =
    cashPrize !== null && ticketPrice !== null && playersOk
      ? minBond(cashPrize, ticketPrice, maxPlayers)
      : undefined

  const start = draft.start
    ? Math.floor(draft.start.getTime() / 1000)
    : undefined
  const end =
    start !== undefined ? start + draft.durationDays * 86_400 : undefined
  if (start === undefined) errors.start = "Choisis une date de début."
  else if (now !== undefined && start < now)
    errors.start = "Le début est déjà passé."

  const valid =
    Object.keys(errors).length === 0 &&
    cashPrize !== null &&
    ticketPrice !== null &&
    bond !== undefined &&
    start !== undefined &&
    end !== undefined

  return {
    factories,
    errors,
    bond,
    end: end !== undefined ? new Date(end * 1000) : undefined,
    params: valid
      ? {
          cashPrize,
          ticketPrice,
          maxPlayers,
          organizerBond: bond,
          startTime: BigInt(start),
          endTime: BigInt(end),
        }
      : undefined,
  }
}

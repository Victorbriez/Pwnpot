// Règles de création d'un CTF, identiques à celles du contrat (docs/DESIGN.md,
// § Paramètres). Le formulaire les vérifie avant l'envoi ; le contrat reste
// la référence et refuse de toute façon une valeur hors bornes.
import { parseEther, type Address } from "viem"

export const MIN_TICKET_PRICE = parseEther("0.0001")
export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 200
/** Longueur maximale du titre, en octets (UTF-8), comme `MAX_TITLE_LENGTH`. */
export const MAX_TITLE_BYTES = 100

const HOUR = 3_600
const DAY = 86_400

/** Bornes de la durée d'un CTF, comme `MIN_DURATION` / `MAX_DURATION`. */
export const MIN_DURATION = HOUR
export const MAX_DURATION = 30 * DAY

/** Durées proposées en un clic, en secondes. Toute autre durée se saisit à la main. */
export const DURATION_PRESETS = [
  { label: "1 h", seconds: HOUR },
  { label: "6 h", seconds: 6 * HOUR },
  { label: "1 j", seconds: DAY },
  { label: "3 j", seconds: 3 * DAY },
  { label: "7 j", seconds: 7 * DAY },
  { label: "30 j", seconds: 30 * DAY },
] as const

/** Unités de la durée personnalisée, en secondes. */
export const DURATION_UNITS = {
  minutes: 60,
  hours: HOUR,
  days: DAY,
} as const
export type DurationUnit = keyof typeof DURATION_UNITS

/**
 * Paramètres envoyés à `createCTF`, en wei et en secondes. Même forme que le
 * struct `CTFParams` du contrat.
 */
export type CtfParams = {
  title: string
  startTime: bigint
  endTime: bigint
  ticketPrice: bigint
  maxPlayers: bigint
  cashPrize: bigint
  organizerBond: bigint
}

/** Ce que l'utilisateur a saisi. */
export type CtfDraft = {
  title: string
  factories: Address[]
  cashPrize: string
  ticketPrice: string
  maxPlayers: string
  /** Date et heure de début, en heure locale. */
  start: Date | undefined
  /** Durée en secondes ; `undefined` si la saisie n'est pas un nombre. */
  durationSeconds: number | undefined
}

export type CtfField =
  | "title"
  | "factories"
  | "cashPrize"
  | "ticketPrice"
  | "maxPlayers"
  | "start"
  | "duration"

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

/** Taille d'un texte en octets UTF-8 (le contrat compte en octets). */
export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
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

  const title = draft.title.trim()
  if (title === "") errors.title = "Donne un nom au CTF."
  else if (byteLength(title) > MAX_TITLE_BYTES)
    errors.title = `${MAX_TITLE_BYTES} octets au plus (les accents comptent double).`

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
  const duration = draft.durationSeconds
  const durationOk =
    duration !== undefined &&
    duration >= MIN_DURATION &&
    duration <= MAX_DURATION
  if (!durationOk) errors.duration = "Entre 1 h et 30 jours."
  const end =
    start !== undefined && durationOk ? start + duration : undefined
  if (start === undefined) errors.start = "Choisis une date et une heure."
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
          title,
          startTime: BigInt(start),
          endTime: BigInt(end),
          ticketPrice,
          maxPlayers: BigInt(maxPlayers),
          cashPrize,
          organizerBond: bond,
        }
      : undefined,
  }
}

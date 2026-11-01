import { parseEther } from "viem"

import { formatEth } from "@/lib/format"
import { cn } from "@/lib/utils"

// Exemple : un CTF avec 4 ETH de cagnotte, 142 tickets à 0,02 ETH, 1,5 ETH de caution.
const funds = [
  {
    key: "pot",
    label: "Cagnotte de l'organisateur",
    amount: parseEther("4"),
    tone: "bg-foreground/20",
  },
  {
    key: "tickets",
    label: "Tickets des joueurs",
    amount: parseEther("2.84"),
    tone: "bg-foreground/12",
  },
  {
    key: "bond",
    label: "Caution",
    amount: parseEther("1.5"),
    tone: "bg-foreground/6",
  },
] as const

const total = funds.reduce((sum, fund) => sum + fund.amount, BigInt(0))

type Destination = "winners" | "players" | "organizer" | "burn"

const destinations: Record<Destination, { label: string; tone: string }> = {
  winners: { label: "Gagnants", tone: "bg-primary" },
  players: { label: "Joueurs remboursés", tone: "bg-info" },
  organizer: { label: "Organisateur", tone: "bg-success" },
  burn: {
    label: "Brûlé",
    tone: "bg-[repeating-linear-gradient(135deg,var(--destructive)_0_6px,transparent_6px_12px)] ring-1 ring-destructive/60 ring-inset",
  },
}

const outcomes: {
  label: string
  when: string
  flows: { to: Destination; amount: bigint }[]
}[] = [
  {
    label: "Des gagnants",
    when: "Au moins un joueur a validé son instance avant la clôture.",
    flows: [
      { to: "winners", amount: parseEther("6.84") },
      { to: "organizer", amount: parseEther("1.5") },
    ],
  },
  {
    label: "Aucun gagnant",
    when: "Personne n'a cassé le contrat.",
    flows: [
      { to: "players", amount: parseEther("2.84") },
      { to: "organizer", amount: parseEther("5.5") },
    ],
  },
  {
    label: "Triche confirmée",
    when: "Un litige a prouvé la triche de l'organisateur.",
    flows: [
      { to: "players", amount: parseEther("2.84") },
      { to: "organizer", amount: parseEther("4") },
      { to: "burn", amount: parseEther("1.5") },
    ],
  },
]

function share(amount: bigint) {
  return `${(Number((amount * BigInt(10_000)) / total) / 100).toFixed(2)}%`
}

function describe(flows: { to: Destination; amount: bigint }[]) {
  return flows
    .map((flow) => `${destinations[flow.to].label} : ${formatEth(flow.amount)}`)
    .join(", ")
}

export function Settlement() {
  return (
    <div className="flex flex-col gap-10">
      {/* Ce que détient le contrat */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            Ce que détient le contrat
          </span>
          <span className="font-mono font-medium tabular-nums">
            {formatEth(total)}
          </span>
        </div>
        <div className="flex h-14 gap-1 overflow-hidden rounded-xl">
          {funds.map((fund) => (
            <div
              key={fund.key}
              style={{ width: share(fund.amount) }}
              className={cn(
                "flex min-w-0 flex-col justify-center px-3",
                fund.tone
              )}
            >
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {fund.label}
              </span>
              <span className="hidden truncate font-mono text-sm tabular-nums sm:block">
                {formatEth(fund.amount)}
              </span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-1.5 text-xs sm:hidden">
          {funds.map((fund) => (
            <li key={fund.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn("size-2.5 rounded-[3px]", fund.tone)}
              />
              <span className="text-muted-foreground">{fund.label}</span>
              <span className="ml-auto font-mono tabular-nums">
                {formatEth(fund.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Les trois issues, alignées sur la même échelle */}
      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground">
          Où il part à la clôture
        </span>
        <ol className="flex flex-col gap-7 border-t pt-6">
          {outcomes.map((outcome) => (
            <li key={outcome.label} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="font-medium">{outcome.label}</span>
                <span className="text-xs text-muted-foreground">
                  {outcome.when}
                </span>
              </div>
              <div
                role="img"
                aria-label={describe(outcome.flows)}
                className="flex h-9 gap-1 overflow-hidden rounded-lg"
              >
                {outcome.flows.map((flow) => (
                  <div
                    key={flow.to}
                    style={{ width: share(flow.amount) }}
                    className={destinations[flow.to].tone}
                  />
                ))}
              </div>
              <div aria-hidden className="flex gap-1">
                {outcome.flows.map((flow) => (
                  <span
                    key={flow.to}
                    style={{ width: share(flow.amount) }}
                    className={cn(
                      "truncate font-mono text-xs tabular-nums",
                      flow.to === "burn"
                        ? "text-destructive line-through"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatEth(flow.amount)}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <ul
          aria-label="Légende"
          className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-5 text-xs"
        >
          {Object.entries(destinations).map(([key, destination]) => (
            <li key={key} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn("size-2.5 rounded-[3px]", destination.tone)}
              />
              <span className="text-secondary-foreground">
                {destination.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
